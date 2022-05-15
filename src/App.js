import React, { useEffect, useState } from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';


function App() {
  return (
    <div className="App">
      <Switch>
        <Route path="/onboarding">
          <OnbardingPage />
        </Route>

        <Route path="/reminder">
          <ReminderPage />
        </Route>

        <Route path="/prompt">
          <PromptPage />
        </Route>

        <Route path="/interaction">
          <InteractionPage />
        </Route>

        <Route path="/finish">
          <FinishPage />
        </Route>

        <Redirect to="/onboarding" />
      </Switch>
    </div>
  );
}

export default App;
