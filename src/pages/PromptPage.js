import React from 'react';
import Mic from '../components/Mic';

export default function PromptPage(props) {
  return (
    <main className='prompt'>
      <p>Press the button and say</p>
      <h1>"I am ready to start Day One"</h1>
      <Mic isSpeaking={true} />
    </main>
  );
}
