import React from 'react';

export default function OnboardingPage(props) {
  return (
    <main>
      <h1>Welcome to Superhero!</h1>
      <div>
        <img className="superhero-img" src="/img/superhero.png" alt="superhero flying emoji" />
        <img className="superhero-img" src="/img/superhero.png" alt="superhero flying emoji" />
      </div>
      { !props.isloggedin && <h2 >Please log in your account</h2>}
      { props.isloggedin && <div className="btn" onClick={props.onStartBtnClick}> Start </div>}
    </main>
  );
}
