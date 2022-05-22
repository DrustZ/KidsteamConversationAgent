import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';
import Mic from './components/Mic';

function App() {
  // create states for current day and what the app state is
  const [day, setDay] = useState(1);
  const [miclistening, setMicListening] = useState(true);
  const [appState, setAppState] = useState(<PromptPage />);

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
    } else {
      // start listening
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
