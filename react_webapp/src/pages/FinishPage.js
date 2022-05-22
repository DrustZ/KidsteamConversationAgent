import React from 'react';
import DiamondList from '../components/DiamondList';

export default function FinishPage(props) {
  const ordinalDays = ['first', 'second', 'third', 'fourth', 'fifth']

  return (
    <main className='finish'>
      <DiamondList day={props.day} />
      <h1>Come back tomorrow!</h1>
      <p>You have {ordinalDays[props.day - 1]} days to go</p>
    </main>
  );
}
