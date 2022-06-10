import React from 'react';

export default function OnboardingPage(props) {
  return (
    <main >
      <div className="main-onboarding">
        <h1 className='welcome-onboarding'>Welcome to Superhero!</h1>
        <div className="superhero-img-div">
          <img className="superhero-img" src="/img/superhero.png" alt="superhero flying emoji" />
          <img className="superhero-img" src="/img/superhero.png" alt="superhero flying emoji" />
        </div>
        <div>
          {!props.isloggedin && <h2 className='welcome-onboarding'>Please log in your account</h2>}
          {props.isloggedin && <div className="btn start_button" onClick={props.onStartBtnClick}> Start! </div>}
        </div>
      </div>


    </main>
  );
}
