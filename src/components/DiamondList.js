import React from 'react';

export default function DiamondList(props) {
  let diamonds = [...Array(5).keys()].map((num, index) => {
    console.log(props.day)
    let src = 'img/diamond-incomplete.png'
    let alt = 'a unfilled diamond'
    if (index < props.day) {
      src = '/img/diamond-complete.png'
      alt = 'a filled diamond'
    }

    return <img src={src} alt={alt} key={num} className='diamond' />
  })

  return (
    <div className='diamond-list'>
      {diamonds}
    </div>
  );
}
