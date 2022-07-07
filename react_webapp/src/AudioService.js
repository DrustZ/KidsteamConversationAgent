//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//  Contact: v@vinzenzaubry.com
import socketIOClient from "socket.io-client";

const ENDPOINT = //"http://localhost:1337"; "https://is-kids.ischool.uw.edu:1337";
export const socket = socketIOClient(ENDPOINT, { transports: ["websocket"] });
socket.on("connect", function (data) {
  console.log("connected to socket");
  socket.emit("join", "Server Connected to Client");
});

//================= SPEECH CONFIG =================
// Play given responses
export var speakResponses = (responses, callback) => {
  let replyTag = responses["replies"];
  let url = `https://superheroaudios.s3.us-west-2.amazonaws.com/${replyTag}.mp3`; // `https://superheroaudios.s3.us-west-2.amazonaws.com/Superhero_synthetic_day1_audio/${replyTag}.mp3`;
  let audio = new Audio(url);
  audio.addEventListener("ended", () => callback());
  audio.play();
};

// Play audio
var outputSource = null;
export var playOutput = (arrayBuffer, callback) => {
  var audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (outputSource !== null) {
    outputSource.stop();
  }
  console.log(audioContext);
  try {
    if (arrayBuffer.byteLength > 0) {
      //   console.log(arrayBuffer.byteLength);
      audioContext.decodeAudioData(
        arrayBuffer,
        function (buffer) {
          audioContext.resume();
          outputSource = audioContext.createBufferSource();
          outputSource.connect(audioContext.destination);
          outputSource.buffer = buffer;
          outputSource.start(0);
          outputSource.onended = function () {
            if (callback) {
              callback();
            }
          };
        },
        function () {
          console.log(arguments);
        }
      );
    }
  } catch (e) {
    console.log(e);
  }
};

//================= AUDIO CONFIG =================
// Stream Audio
let bufferSize = 2048,
  AudioContext,
  context,
  processor,
  input,
  globalStream;

//vars
let streamStreaming = false;

//audioStream constraints
const constraints = {
  audio: true,
  video: false,
};

window.onbeforeunload = function () {
  if (streamStreaming) {
    socket.emit("endGoogleCloudStream", "");
    socket.emit("clientleave", "");
  }
  socket.disconnect();
};

export var microphoneRecorder = function () {
  //================= RECORDING =================
  this.startRecording = (userEmail) => {
    socket.emit("startGoogleCloudStream", userEmail); //init socket Google Speech Connection
    streamStreaming = true;
    AudioContext = window.AudioContext || window.webkitAudioContext;
    console.log("audio context: ", AudioContext);
    context = new AudioContext({
      // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
      latencyHint: "interactive",
    });
    processor = context.createScriptProcessor(bufferSize, 1, 1);
    processor.connect(context.destination);
    context.resume();

    var handleSuccess = function (stream) {
      globalStream = stream;
      input = context.createMediaStreamSource(stream);
      input.connect(processor);

      processor.onaudioprocess = function (e) {
        microphoneProcess(e);
      };
    };
    navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess);
  };

  function microphoneProcess(e) {
    var left = e.inputBuffer.getChannelData(0);
    var left16 = downsampleBuffer(left, 44100, 16000);
    socket.emit("binaryData", left16);
  }

  this.stopRecording = () => {
    // console.log("stop recording")
    streamStreaming = false;
    socket.emit("endGoogleCloudStream", "");
    let track = globalStream.getTracks()[0];
    track.stop();

    input.disconnect(processor);
    processor.disconnect(context.destination);
    context.close().then(function () {
      input = null;
      processor = null;
      context = null;
      AudioContext = null;
    });
  };

  var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
    if (outSampleRate == sampleRate) {
      return buffer;
    }
    if (outSampleRate > sampleRate) {
      throw "downsampling rate show be smaller than original sample rate";
    }
    var sampleRateRatio = sampleRate / outSampleRate;
    var newLength = Math.round(buffer.length / sampleRateRatio);
    var result = new Int16Array(newLength);
    var offsetResult = 0;
    var offsetBuffer = 0;
    while (offsetResult < result.length) {
      var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      var accum = 0,
        count = 0;
      for (
        var i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result.buffer;
  };
};
