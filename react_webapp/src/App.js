import React, { useEffect } from 'react';
// make the third argument of const [issameday, setIsSameDay, issamedayRef] available which is 
// the most current state https://www.npmjs.com/package/react-usestateref
import useState from 'react-usestateref'

import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';
import Mic from './components/Mic';
import { GoogleLogin } from './components/GoogleLogin';
import { microphoneRecorder, socket, speakResponses } from './AudioService'

var currentResponse = ''
var greetingaudio = null

var silentTime = 8000 // 8 secs
var timeInterval_short;
var timeInterval_long;
var currentSilence = 0; // max silentces = 2

var recodrder = new microphoneRecorder()

function App() {
  // create states for current day and what the app state is
  const [day, setDay, dayRef] = useState(1);

  const [issameday, setIsSameDay, issamedayRef] = useState(false)
  const [userEmail, setUserEmail, userEmailRef] = useState('')
  // ========== MIC status ================
  const [showmic, setShowMic, showmicRef] = useState(false)
  // whether the mic is listening
  const [miclistening, setMicListening, miclisteningRef] = useState(false);
  // whether the audio is playing
  const [audioplaying, setAudioPlaying, audioplayingRef] = useState(false);
  // whether the current recognition is finished
  const [recognizeFinished, setRecognizeFinished, recognizeFinishedRef] = useState(true);
  const [clickwhenrecognize, setClickWhenRecgnize, clickwhenrecognizeRef] = useState(false);

  // ========== Current Page status ================
  const [currentpage, setCurrentPage, currentpageRef] = useState(<OnboardingPage />);
  const [appState, setAppState, appStateRef] = useState('onboarding');


  // ========== Socket receive ================
  // init data 
  useEffect(() => {
    // configuration of the socketIO
    socket.on('assistantResponse', (responses) => {
      setAudioPlaying(true)
      // if after the response need to change the status
      // we change the current status
      if (responses['changeStatus'].length > 0) {
        setAppState(responses['changeStatus'])
        console.log('app state changed to ', responses['changeStatus'])
      }
      speakResponses(responses, 0, () => {
        if (appStateRef.current != 'finish')
          { 
            startRecording() 
            // set a timer for silence & remind
            initTimer()
          }
      })
    })

    socket.on('greetingResponse', (responses) => {
      console.log(responses)
      greetingaudio = responses
    })

    socket.on('speechData', function (data) {
      handleSpeechData(data)
    });

    // for reminder - get the reminder audio
    socket.on('textaudio', (responses) => {
      if (audioplayingRef.current) { return }

      speakResponses(responses, 0, () => {
          resumeRecording()
      })
    })

    socket.on('userday', (data) => {
      //get the day of the user
      setDay(data['day'])
      setIsSameDay(data['sameday'])
      console.log('user day: ', data)
    })
  }, []);



  // update email => username 
  const userUpdated = (email) => {
    email = email.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_")
    setUserEmail(email)
    if (email.lengh == 0) {
      // log out
      console.log('logged out')
    } else {
      console.log(`signed in as ${email}`)
      socket.emit('userLogin', email)
    }
    setCurrentPage(<OnboardingPage
      isloggedin={email.length > 0}
      onStartBtnClick={() => onStartBtnClick()} />)
  }

  const handleSpeechData = (data) => {
    // reset timer every time we get speech
    currentSilence = 0 
    clearTimeout(timeInterval_short)
    clearTimeout(timeInterval_long)

    var dataFinal = undefined || data.results[0].isFinal;
    if (dataFinal) {
      let response = data.results[0].alternatives[0].transcript
      currentResponse += ' ' + response
      console.log(currentResponse)
      setRecognizeFinished(true)

      if (clickwhenrecognizeRef.current) {
        setClickWhenRecgnize(false)
        handleMicClick()
      } else {
        initTimer()
      }
    } else if (dataFinal == false) {
      setRecognizeFinished(false)
    }
  } 

  const initTimer = () => {
    console.log('initTimer here')
    clearTimeout(timeInterval_short)
    clearTimeout(timeInterval_long)
    currentSilence = 0
    if (audioplayingRef.current) return

    timeInterval_short = setTimeout(function() {
      if (currentSilence === 0) {
        // play reminder
        console.log('playing first reminder')
        if (audioplayingRef.current) { clearTimeout(timeInterval_long); return }
        socket.emit('speechText', {'text': 'If you finish, please click the button.'})
        currentSilence += 1
        pauseRecording()
      }
    }, silentTime);

    timeInterval_long = setTimeout(() => {
      if (currentSilence === 1) {
        console.log('playing default go')
        if (audioplayingRef.current) { return }
        // play default go next message
        // force stop microphone
        stopRecording()
        currentSilence = 0
      }
    }, silentTime*2)
  }

  const resumeRecording = () => {
    console.log('resume recording')
    setAudioPlaying(false)
    recodrder.startRecording(userEmailRef.current)
    setMicListening(true)
  }

  const pauseRecording = () => {
    console.log('pause recording')
    recodrder.stopRecording()
    setClickWhenRecgnize(false)
    setMicListening(false)
  }

  const stopRecording = () => {
    recodrder.stopRecording()
    setClickWhenRecgnize(false)
    socket.emit('userResponse', {'uid': userEmailRef.current, 'response':currentResponse});
    setMicListening(false)
  }

  const startRecording = () => {
    setAudioPlaying(false)
    currentResponse = ''
    recodrder.startRecording(userEmailRef.current)
    setMicListening(true)
  }

  const handleMicClick = () => {
    if (miclisteningRef.current) {
      if (!recognizeFinishedRef.current) {
        if (!clickwhenrecognizeRef.current) { setClickWhenRecgnize(true) }
        return
      } //return if the final recognition hasn't come
      stopRecording()
    } else {
      if (audioplayingRef.current) { return } // return if the assistant is speaking
      startRecording()
    }
  }

  // callback function used to change state of app
  function handleNewState() {
    currentResponse = ''
    switch (appState) {
      case "onbarding":
        setCurrentPage(<OnboardingPage
          isloggedin={userEmail.length > 0}
          onStartBtnClick={() => onStartBtnClick} />)
        break;
      case "reminder":
        setCurrentPage(<ReminderPage day={day} />)
        break;
      case "prompt":
        setCurrentPage(<PromptPage day={day} />)
        break;
      case "interaction":
        setCurrentPage(<InteractionPage botSpeaking={!miclisteningRef.current}/>)
        break;
      case "finish":
        setShowMic(false)
        setCurrentPage(<FinishPage day={day} />)
        break;
      default:
        setCurrentPage(<OnboardingPage />)
    }
  }

  // whenever state hanges, we call the handle funciton
  useEffect(() => {
    handleNewState()
  }, [appState])

  // ======= Page callbacks ==============
  // user click start button to start conversation
  const onStartBtnClick = () => {
    setAudioPlaying(true)
    setAppState('reminder')
    speakResponses(greetingaudio, 0, () => {
      // change to prompt
      setAppState('prompt')
      setShowMic(true)
      // we fake a user respones to start the real first conversation
      socket.emit('userResponse', {'uid': userEmailRef.current, 'response':'start prompt'});
    })
  }

  return (
    <div className="voiceapp">
      {appState === 'onboarding' && <GoogleLogin userUpdated={userUpdated}/>}
      {/* have to add interaction here so that it can rerender on state change */}
      {appState === 'interaction' && <InteractionPage botSpeaking={!miclisteningRef.current}/>}
      {appState != "interaction" && currentpage}
      {showmicRef.current && <Mic isListening={miclisteningRef.current} onMicClick={handleMicClick}/>}
    </div>
  );
}

export default App;
