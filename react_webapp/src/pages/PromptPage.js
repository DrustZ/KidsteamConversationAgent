import React, { useState, useEffect } from 'react';
import Mic from '../components/Mic'


export default function PromptPage(props) {
  const daydict = { 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five' }
  return (
    <main className='prompt'>
      <h2 className="prompt-say">Say</h2>
      <h1>"I am ready to start Day {daydict[props.day]}"</h1>
      <p>and press the button to continue.</p>
      <Mic />
    </main>
  );
}
