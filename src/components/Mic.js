import React from 'react';

export default function Mic(props) {
  let mic
  if (props.isSpeaking) {
    mic = <img src='/img/mic-speak.png' alt='microphone button listening for input' className='mic-button' />
  } else {
    mic = <img src='/img/mic-nospeak.png' alt='microphone button not listening for input' className='mic-button' />
  }

  return (
    <div>
      {mic}
    </div>
  );
}
