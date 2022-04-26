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

  document.querySelector(".sign-in-or-out-link").addEventListener("click", handleAuthClick);
  initClient()
  
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


// Auth
var GoogleAuth; // Google Auth object.
var SCOPE = 'https://www.googleapis.com/auth/drive.metadata.readonly'
function initClient() {
  gapi.load('client:auth2', function() {
    gapi.client.init({
        'apiKey': 'AIzaSyD7Zp3_FWdx3wF4BfV2DySb2ip9yeiXI2Q',
        'clientId': '424897191860-1m709avq1lkkt65mrqf8kjrjsthplqgh.apps.googleusercontent.com',
        'scope': SCOPE,
    }).then(function () {
        GoogleAuth = gapi.auth2.getAuthInstance();

        // Listen for sign-in state changes.
        GoogleAuth.isSignedIn.listen(updateSigninStatus);
        // Handle initial sign-in state. (Determine if user is already signed in.)
        var user = GoogleAuth.currentUser.get();
        setSigninStatus();
    });
  });
}

function setSigninStatus(isSignedIn) {
  var user = GoogleAuth.currentUser.get();
  var isAuthorized = user.hasGrantedScopes(SCOPE);
  if (isAuthorized) {
    console.log("User signed in. Updating UI to reflect that");
    var email = user.getBasicProfile().getEmail();

    document.querySelector(".sign-in-or-out-label").innerHTML = 'Signed in as ' + email + ".";
    document.querySelector(".sign-in-or-out-link").innerHTML = 'Sign out';
    document.querySelector(".app-footer").classList.remove("not-signed-in");
  } else {
    console.log("User not signed in. Updating UI to reflect that.");
    document.querySelector(".sign-in-or-out-label").innerHTML = 'Not signed in. You must sign in with Google to continue.';
    document.querySelector(".sign-in-or-out-link").innerHTML = 'Sign in';
    document.querySelector(".app-footer").classList.add("not-signed-in");
  }
}

function updateSigninStatus(isSignedIn) {
  setSigninStatus(isSignedIn);
}

function handleAuthClick() {
  if (GoogleAuth.isSignedIn.get()) {
    // User is authorized and has clicked 'Sign out' button.
    GoogleAuth.signOut();
  } else {
    // User is not signed in. Start Google auth flow.
    GoogleAuth.signIn();
  }
}