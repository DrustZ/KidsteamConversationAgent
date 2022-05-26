import React from 'react';
import DiamondList from '../components/DiamondList';

export default function FinishPage(props) {
  const remainingDays = ['4 days', '3 days', '2 days', '1 day', '0 day']

  return (
    <main className='finish'>
      <DiamondList day={props.day} />
      <h1>Come back tomorrow!</h1>
      <p>You have {remainingDays[props.day]} to go</p>
    </main>
  );
}
