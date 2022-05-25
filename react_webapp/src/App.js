import React, { useEffect } from 'react';
// to avoid callback still only use old state values
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

function App() {
  // create states for current day and what the app state is
  const [day, setDay, dayRef] = useState(1);
  const [issameday, setIsSameDay, issamedayRef] = useState(false);
  const [userEmail, setUserEmail, userEmailRef] = useState('')
  // ========== MIC status ================
  // whether the mic is listening
  const [miclistening, setMicListening, miclisteningRef] = useState(false);
  // whether the audio is playing
  const [audioplaying, setAudioPlaying, audioplayingRef] = useState(false);
  // whether the current recognition is finished
  const [recognizeFinished, setRecognizeFinished, recognizeFinishedRef] = useState(true);
  const [clickwhenrecognize, setClickWhenRecgnize, clickwhenrecognizeRef] = useState(false);
  
  const [appState, setAppState] = useState(<OnboardingPage />);
  var recodrder = new microphoneRecorder()

  // init data
  useEffect(() => {
    // configuration of the socketIO
    socket.on('assistantResponse', (responses) => {
      setAudioPlaying(true)

      if (responses['finished']) {
        //finish this session
      }

      speakResponses(responses['audios'], 0, startRecording)
    })
    
    socket.on('speechData', function (data) {
      handleSpeechData(data)
    });

    socket.on('userday', (data) => {
      //get the day of the user
      setDay(data['day'])
      setIsSameDay(data['sameday'])
      console.log('user day: ', data)
    })
  }, []);

  const userUpdated = (email) => {
    email = email.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"_")
    setUserEmail(email)
    if (email.lengh == 0) {
      // log out
      console.log('logged out')
    } else {
      console.log(`signed in as ${email}`)
      socket.emit('userLogin', email)
    }
  }

  const handleSpeechData = (data) => {
    var dataFinal = undefined || data.results[0].isFinal;
    if (dataFinal){
      let response = data.results[0].alternatives[0].transcript
      currentResponse += ' ' + response
      console.log(currentResponse)
      setRecognizeFinished(true)

      if (clickwhenrecognizeRef.current){
        setClickWhenRecgnize(false)
        handleMicClick()
      }
    } else if (dataFinal == false) {
      setRecognizeFinished(false)
    }
  }

  // callback function used to change state of app
  function handleNewState(state) {
    currentResponse = ''
    switch (state) {
      case "onbarding":
        setAppState(<OnboardingPage/>)
        break;
      case "reminder":
        setAppState(<ReminderPage day={day} />)
        break;
      case "prompt":
        setMicListening(true)
        setAppState(<PromptPage />)
        break;
      case "interaction":
        setMicListening(true)
        setAppState(<InteractionPage />)
        break;
      case "finish":
        setAppState(<FinishPage day={day} />)
        break;
      default:
        setAppState(<OnboardingPage />)
    }
  }

  const stopRecording = () => {
    recodrder.stopRecording()
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

  return (
    <div className="voiceapp">
      <GoogleLogin userUpdated={userUpdated}/>
      {appState}
      <Mic isListening={miclisteningRef.current} onMicClick={handleMicClick}/>
    </div>
  );
}

export default App;
