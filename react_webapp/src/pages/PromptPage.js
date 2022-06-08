import React from 'react';

export default function PromptPage(props) {
  const daydict = {1:'One', 2:'Two', 3:'Three', 4:'Four', 5:'Five'}
  return (
    <main className='prompt'>
      <p>Press the button and say</p>
      <h1>"I am ready to start Day {daydict[props.day]}"</h1>
    </main>
  );
}
