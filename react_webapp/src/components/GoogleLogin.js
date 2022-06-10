import React, { useState, useEffect } from 'react';

export const GoogleLogin  = (props) => {
  const [userID, setUserID] = useState(null);
  const [userLoggedIn, setuserLoggedIn] = useState(false)

  const handleLoginClick = () => {
    if (props.userUpdated) {
        props.userUpdated(userID)
    }
    setuserLoggedIn(true)
  };

  if(userLoggedIn) {
    return (
        <div className="GloginContainer"> 
            <p>Logged in as: {userID}</p>
        </div>
    );
  }

  return (
    <div className="GloginContainer">
      UserID:
      <input type="text" name="userid" onChange={e => setUserID(e.target.value)}/>
      <div className="btn" id="loginBtn" onClick={handleLoginClick}>
        Login
      </div>
    </div>
  );
}
