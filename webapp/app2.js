function isChrome() {
  var isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

  if(isIOSChrome){
    return true;
  } else if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
    return true;
  } else {
    return false;
  }
}

// https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
function uuid() {
    function randomDigit() {
        if (crypto && crypto.getRandomValues) {
            var rands = new Uint8Array(1);
            crypto.getRandomValues(rands);
            return (rands[0] % 16).toString(16);
        } else {
            return ((Math.random() * 16) | 0).toString(16);
        }
    }
    var crypto = window.crypto || window.msCrypto;
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}

function gotoListeningState() {
  const micListening = document.querySelector(".mic .listening");
  const micStop = document.querySelector(".mic .ready");

  micListening.style.display = "block";
  // micReady.style.display = "block";
}

function gotoReadyState() {
  const micListening = document.querySelector(".mic .listening");
  const micReady = document.querySelector(".mic .ready");

  micListening.style.display = "none";
  // micReady.style.display = "block";
}

function addBotItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-bot"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function addUserItem(text) {
  const appContent = document.querySelector(".app-content");
  appContent.innerHTML += '<div class="item-container item-container-user"><div class="item"><p>' + text + '</p></div></div>';
  appContent.scrollTop = appContent.scrollHeight; // scroll to bottom
}

function displayCurrentTime() {
  const timeContent = document.querySelector(".time-indicator-content");
  const d = new Date();
  const s = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  timeContent.innerHTML = s;
}

function addError(text) {
  addBotItem(text);
  const footer = document.querySelector(".app-footer");
  footer.style.display = "none";
}

var outputSource = null;
function playOutput(arrayBuffer, callback){
  var audioContext = new AudioContext();
  if (outputSource !== null) {
    outputSource.stop()
  }
  try {
      if(arrayBuffer.byteLength > 0){
          console.log(arrayBuffer.byteLength);
          audioContext.decodeAudioData(arrayBuffer,
          function(buffer){
              audioContext.resume();
              outputSource = audioContext.createBufferSource();
              outputSource.connect(audioContext.destination);
              outputSource.buffer = buffer;
              outputSource.start(0);
              outputSource.onended = function() {
                if (callback) {
                  callback()
                }
              }
          },
          function(){
              console.log(arguments);
          });
      }
  } catch(e) {
      console.log(e);
  }
}

document.addEventListener("DOMContentLoaded", function(event) {

  // test for relevant API-s
  // for (let api of ['speechSynthesis', 'webkitSpeechSynthesis', 'speechRecognition', 'webkitSpeechRecognition']) {
  //   console.log('api ' + api + " and if browser has it: " + (api in window));
  // }

  displayCurrentTime();

  // check for Chrome
  if (!isChrome()) {
    addError("This demo only works in Google Chrome.");
    return;
  }

  if (!('speechSynthesis' in window)) {
    addError("Your browser doesn’t support speech synthesis. This demo won’t work.");
    return;
  }

  if (!('webkitSpeechRecognition' in window)) {
    addError("Your browser cannot record voice. This demo won’t work.");
    return;
  }

  // Now we’ve established that the browser is Chrome with proper speech API-s.

  // Initial feedback message.
  addBotItem("Hi, welcome back to our superhero vs. supervillain story. Are you ready to start a new adventure with our superhero Zip?");

  var sessionId = uuid();

  var recognizing = false;
  var recognition = new webkitSpeechRecognition();
  let recognizedText = '';
  recognition.continuous = true;
  recognition.onstart = function() {
    recognizing = true;
  };

  recognition.onresult = function(ev) {
    // recognizedText = ev["results"][0][0]["transcript"];
    var final_transcript = '';
    for (var i = ev.resultIndex; i < ev.results.length; ++i) {
      if (ev.results[i].isFinal) {
          final_transcript += ev.results[i][0].transcript;
      } else {
          interim_transcript += ev.results[i][0].transcript;
      }
    }
    if (final_transcript.length > 0) {
      recognizedText += final_transcript + ' ';
      addUserItem(final_transcript);
    }
  };

  recognition.onerror = function(ev) {
    recognizing = false;
    console.log("Speech recognition error", ev);
  };

  recognition.onend = function() {
    recognizing = false;
    gotoReadyState();
  };


  function startListening() {
    gotoListeningState();
    recognition.start();
  }
  startListening();

  recognizing = true
  const stopButton = document.querySelector("#stop");
  stopButton.addEventListener("click", function(ev) {
    console.log('text: ' + recognizedText)
    if (recognizing){
      recognition.stop()
      gotoReadyState()
      //user hit button, time to send the utterance
      $.ajax({
        url: "http://localhost:8730",
        type: "get", //send it through get method
        dataType: "json",
        data: { 
          uid: sessionId, 
          speech: encodeURIComponent(recognizedText) 
        },
        success: function(response) {
          // console.log(response['audio'])
          speakResponses(response, 0)
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(textStatus, errorThrown); //error logging
        }
      });

      recognizedText = '';
    } else {
      startListening()
    }
    ev.preventDefault();
  });

function speakResponses(responses, index) {
  // window.speechSynthesis.cancel()
  // var msg = new SpeechSynthesisUtterance(responses[index]);
  addBotItem(responses['text'][index]);
  var stop_saying = false
  if (index+1 >= responses['text'].length) {
    stop_saying = true
  }

  function endOrCont(){
    if (stop_saying){
      startListening();
    } else {
      setTimeout(function () {
        speakResponses(responses, index+1)
      }, 2000);
    }
  }
  var url = "data:audio/mp3;base64,"+responses['audio'][index]
          fetch(url)
  .then(res => res.blob())
  .then(blob => {
    new Response(blob).arrayBuffer()
        .then( ab => {
          playOutput(ab, endOrCont)
        });
  })
  // window.speechSynthesis.speak(msg);
}


});
