import React from 'react';

function Avatar(props) {
  let classes = "profile"
  if (props.isSpeaking) {
    classes += " active"
  } else {
    classes += " inactive"
  }

  return (
    <div className={classes}>
      <img src={props.src} alt="profile for who is speaking" className='pfp'/>
    </div>
  );
}

export default Avatar;
