'use strict';

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//	Contact: v@vinzenzaubry.com
const util = require('util');
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

// =========================== SOCKET.IO ================================ //
let outputFileStream;

io.on('connection', function (client) {
  console.log('Client Connected to server');
  let recognizeStream = null;

  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  client.on('userResponse', function (data) {
    console.log(data)
    generateAudio('testing this').then(audio => {
      console.log("return!")
      client.emit('assistantResponse', [audio])
    })
  });

  client.on('startGoogleCloudStream', function (data) {
    startRecognitionStream(this, data);
    console.log("start")
    outputFileStream = new WavFileWriter(`test.wav`, {
      sampleRate: 16000,
      bitDepth: 16,
      channels: 1
    });
  });

  client.on('endGoogleCloudStream', function () {
    if (outputFileStream) {
      outputFileStream.end();
    }
  
    outputFileStream = null;
    stopRecognitionStream();
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

  function startRecognitionStream(client) {
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
