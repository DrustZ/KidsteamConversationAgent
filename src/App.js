import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import ReminderPage from './pages/ReminderPage';
import PromptPage from './pages/PromptPage';
import InteractionPage from './pages/InteractionPage';
import FinishPage from './pages/FinishPage';


function App() {
  const [appState, setAppState] = useState("onboarding");

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<OnboardingPage />} />

        <Route path="/reminder" element={<ReminderPage />} />
        
        <Route path="/prompt" element={<PromptPage />} />

        <Route path="/interaction" element={<InteractionPage />} />

        <Route path="/finish" element={<FinishPage />} />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </div>
  );
}

export default App;
