import React from 'react';

function Avatar(props) {
  let classes = "profile " + props.class
  if (props.isSpeaking) {
    classes += " active"
  } else {
    classes += " inactive"
  }
  return (
    <div className={classes}>
      <img src={props.src} alt="profile picture" className='pfp'/>
    </div>
  );
}

export default Avatar;
