'use strict';

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//	Contact: v@vinzenzaubry.com
const utils = require('./util');
const DialogManager = require('./conversation').DialogManager;

const fs = require('fs');
const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const environmentVars = require('dotenv').config();
const WavFileWriter = require('wav').FileWriter;

// Google Cloud
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient(); // Creates a client

// TTS
const textToSpeech = require('@google-cloud/text-to-speech');
const ttsclient = new textToSpeech.TextToSpeechClient();

const app = express();
const port = process.env.PORT || 1337;
const server = require('http').createServer(app);

const io = require('socket.io')(server);

const recording_dir = './recordings'
const text_dir = './transcriptions'
if (!fs.existsSync(recording_dir)){
  fs.mkdirSync(recording_dir);
}
if (!fs.existsSync(text_dir)){
  fs.mkdirSync(text_dir);
}

// max study days
const maxDay = 5

var classification_client;

// =========================== SOCKET.IO ================================ //
io.on('connection', function (client) {
  console.log('Client Connected to server');
  // file streams
  let outputFileStream = null;
  let recognizeStream = null;
  let textloggerStream = null;

  let day = 0;
  let sameday = false;
  let clientID;

  let recording_fname = "";
  let log_fname = "";
  let dm; //dialog manager

  client.on('join', function (data) {
    if (data === 'sentiment') {
      classification_client = client;
    }
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  client.on('userLogin', function (cid) {
    clientID = cid;
    console.log('get cid ', clientID)
    // clean all cached recordings
    utils.deleteDirFilesWithPrefix(cid, recording_dir+'/')
    utils.deleteDirFilesWithPrefix(cid, text_dir+'/')
    utils.getDayOfUser(cid, (user_day, same_day) => {
      day = user_day
      sameday = same_day
      dm = new DialogManager(day)
      console.log('[day of user] ', day, sameday)
      client.emit('userday', {'day':day, 'sameday': same_day})
      // generate greeting audios
      let greetings = dm.getGreetingResponse().split(';')
      generateAudios(greetings).then(audios => {
        client.emit('greetingResponse', 
                    {'audios': audios, 'replies': greetings})
      })
    })
  })

  client.on('userResponse', function (data) {
    // classification_client.emit(
    //   "get_sentiment", data['text'], (sentdata) => {
      
      let res = getResponses(data)
      
      generateAudios(res[0]).then(audios => {
        client.emit('assistantResponse', {'audios': audios, 'replies': res[0], 'changeStatus': res[1]})
      })
    // });
  });

  // client is sending a text for TTS speech audio
  client.on('speechText', (data) => {
    generateAudios([data['text']]).then(audios => {
      client.emit('textaudio', {'audios': audios, 'replies': [data['text']]})
    })
  })

  // client is leaving the page
  client.on('clientleave', (data) => {
    if (textloggerStream) {
      textloggerStream.end()
      textloggerStream = null
    }
    utils.uploadFileToS3NDelete(text_dir+'/'+log_fname, log_fname)
  })

  client.on('startGoogleCloudStream', function (data) {
    startRecognitionStream(this);
    console.log("start")
    recording_fname = `${clientID}_${utils.getTimeStamp()}.wav`;
    outputFileStream = new WavFileWriter(recording_dir+'/'+recording_fname, {
      sampleRate: 16000,
      bitDepth: 16,
      channels: 1
    });
  });

  client.on('endGoogleCloudStream', function (data) {
    if (outputFileStream) {
      outputFileStream.end();
    }
    outputFileStream = null;
    stopRecognitionStream();
    // utils.uploadFileToS3NDelete(recording_dir+'/'+recording_fname, recording_fname)
  });

  client.on('binaryData', function (data) {
    // console.log(data); //log binary data
    if (outputFileStream) {
      outputFileStream.write(data);
    }
    if (recognizeStream !== null) {
      recognizeStream.write(data);
    }
  });

  function getResponses(data) {
    let responses = [];
    let changeStatus = ''; // the status to change to
    // might get multiple sequential responses, separated with ;
    if (dm === undefined || day === 0) {
      responses = ["Connection lost. Please refresh the page to restart."]
    } else {
      // init new text logger 
      if (textloggerStream === null) {
        log_fname = `${clientID}_day${day}_${utils.getTimeStamp()}.txt`;
        fs.closeSync(fs.openSync(text_dir+'/'+log_fname, 'w'))
        textloggerStream = fs.createWriteStream(text_dir+'/'+log_fname, {
          flags: 'a' // 'a' means appending (old data will be preserved)
        })
        textloggerStream.write(`START DAY ${day}\n`)
      }

      let dmresponse = dm.getResponse(data['response'])
      responses = dmresponse.split(';')
      textloggerStream.write(`user:\t${data[`response`]}\n`)
      textloggerStream.write(`da:\t${dmresponse}\n`)

      console.log('status: ', dm.status)
      if (dm.status === 'finish') {
        //conversation finished. 
        changeStatus = 'finish';
        utils.finishConversation(clientID, day)
        textloggerStream.write(`FINISH\n`)
        textloggerStream.end()
        textloggerStream = null
        utils.uploadFileToS3NDelete(text_dir+'/'+log_fname, log_fname)
      }

      if (dm.status === '1') {
        changeStatus = 'interaction'
      }
    }
    return [responses, changeStatus]
  }
 

  function startRecognitionStream(client) {
    try{
      recognizeStream = speechClient
        .streamingRecognize(request)
        .on('error', console.error)
        .on('data', (data) => {
          // process.stdout.write(
          //   data.results[0] && data.results[0].alternatives[0]
          //     ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
          //     : '\n\nReached transcription time limit, press Ctrl+C\n'
          // );
          client.emit('speechData', data);

          // if end of utterance, let's restart stream
          // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
          if (data.results[0] && data.results[0].isFinal) {
            stopRecognitionStream();
            startRecognitionStream(client);
            // console.log('restarted stream serverside');
          }
        });
    } catch (e) {
      console.log(e)
    }
  }

  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
    }
    recognizeStream = null;
  }
});

// =========================== GOOGLE CLOUD TTS SETTINGS ================================ //

async function generateAudio(text) {
    // Construct the request
  const request = {
    input: {text: text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await ttsclient.synthesizeSpeech(request);
  return response.audioContent
}

async function generateAudios(texts) {
  let audios = []
  for (let text of texts){
    let audio = await generateAudio(text)
    audios.push(audio)
  }
  return audios
}

// =========================== GOOGLE CLOUD STT SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,
    enableWordTimeOffsets: true,
    // speechContexts: [{
    //     phrases: ["hoful","shwazil"]
    //    }] // add your own speech context for better recognition
  },
  interimResults: true, // If you want interim results, set this to true
};

// =========================== START SERVER ================================ //

server.listen(port, '127.0.0.1', function () {
  //http listen, to make socket work
  // app.address = "127.0.0.1";
  console.log('Server started on port:' + port);
});
