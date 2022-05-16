import React, { useEffect, useState } from 'react';
import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';


function App() {
  const [day, setDay] = useState(1);
  const [appState, setAppState] = useState(<OnboardingPage />);
  function handleNewState(state) {
    switch (state) {
      case "onbarding":
        setAppState(<OnboardingPage />)
        break;
      case "reminder":
        setAppState(<ReminderPage day={day}/>)
        break;
      case "prompt":
        setAppState(<PromptPage />)
        break;
      case "interaction":
        setAppState(<InteractionPage />)
        break;
      case "finish":
        setAppState(<FinishPage />)
        break;
      default:
        setAppState(<OnboardingPage />)
    }
    setAppState(state)
  }

  return (
    <div className="voiceapp">
      {appState}
    </div>
  );
}

export default App;
