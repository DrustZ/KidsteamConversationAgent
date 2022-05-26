import React from 'react';
import DiamondList from '../components/DiamondList';

export default function ReminderPage(props) {
  const ordinalDays = ['first', 'second', 'third', 'fourth', 'fifth']

  return (
    <main className='reminder'>
      {/* create diamond with day number in it */}
      <div className='diamond-day'>
        <img src='/img/diamond-day.png' alt='diamond showing the interaction day' />
        <div className='day-text'>{props.day}</div>
      </div>
      <DiamondList day={props.day} />
      <h1>5 day story!</h1>
      <p>This is the {ordinalDays[props.day - 1]} day!</p>
    </main>
  );
}
