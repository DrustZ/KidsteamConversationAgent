import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';
import Mic from './components/Mic';
import { microphoneRecorder, socket, speakResponses } from './AudioService'
var currentResponse = ''

function App() {
  // create states for current day and what the app state is
  const [day, setDay] = useState(1);

  // ========== MIC status ================
  // whether the mic is listening
  const [miclistening, setMicListening] = useState(false);
  // whether the current recognition is finished
  const [recognizeFinished, setRecognizeFinished] = useState(true);

  const [appState, setAppState] = useState(<PromptPage />);
  var recodrder = new microphoneRecorder()

  // init data
  useEffect(() => {
    // configuration of the socketIO
    socket.on('speechData', function (data) {
      handleSpeechData(data)
    });

    socket.on('assistantResponse', (responses) => {
      speakResponses(responses, 0, startRecording)
    })
  }, []);

  const handleSpeechData = (data) => {
    var dataFinal = undefined || data.results[0].isFinal;
    if (dataFinal){
      let response = data.results[0].alternatives[0].transcript
      currentResponse += ' ' + response
      console.log(currentResponse)
      setRecognizeFinished(true)
    } else if (dataFinal == false) {
      setRecognizeFinished(false)
    }
  }

  // callback function used to change state of app
  function handleNewState(state) {
    currentResponse = ''
    switch (state) {
      case "onbarding":
        setAppState(<OnboardingPage />)
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
    console.log('recodrder',recodrder)
    recodrder.stopRecording()
    socket.emit('userResponse', {'uid': 'abc', 'response':currentResponse});
  }

  const startRecording = () => {
    console.log('recodrder',recodrder)
    currentResponse = ''
    recodrder.startRecording()
  }

  const handleMicClick = () => {
    if (miclistening) {
      if (!recognizeFinished) { return} //return if the final recognition hasn't come
      stopRecording()
    } else {
      startRecording()
    }
    console.log(`clicked ${miclistening}`)
    setMicListening(!miclistening)
  }

  return (
    <div className="voiceapp">
      {appState}
      <Mic isListening={miclistening} onMicClick={handleMicClick}/>
    </div>
  );
}

export default App;
