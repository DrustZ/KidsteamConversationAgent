import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';
import Mic from './components/Mic';
import { microphoneRecorder, socket } from './Recorder'

function App() {
  // create states for current day and what the app state is
  const [day, setDay] = useState(1);
  const [miclistening, setMicListening] = useState(false);
  const [appState, setAppState] = useState(<PromptPage />);
  var recodrder = new microphoneRecorder()

  useEffect(() => {
    // configuration of the socketIO
    socket.on('speechData', function (data) {
      handleSpeechData(data)
    });
  }, []);

  const handleSpeechData = (data) => {
    console.log(data.results[0].alternatives[0].transcript);
    // var dataFinal = undefined || data.results[0].isFinal;
  }

  // callback function used to change state of app
  function handleNewState(state) {
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

  const handleMicClick = () => {
    if (miclistening) {
      // stop listening
      console.log('recodrder',recodrder)
      recodrder.stopRecording()
    } else {
      // start listening
      console.log('recodrder',recodrder)
      recodrder.startRecording()
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
