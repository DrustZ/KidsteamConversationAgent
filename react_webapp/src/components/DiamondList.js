import React from 'react';

export default function DiamondList(props) {
  // create a list of diamonds and fill them in depending on day
  let diamonds = [...Array(5).keys()].map((num, index) => {
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
