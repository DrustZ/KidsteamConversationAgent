import React, { useState, useEffect } from 'react';
import { gapi, loadAuth2 } from 'gapi-script'

export const GoogleLogin  = (props) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const setAuth2 = async () => {
        const auth2 = await loadAuth2(gapi, process.env.REACT_APP_GAUTH_ID, '')
        if (auth2.isSignedIn.get()) {
            updateUser(auth2.currentUser.get())
        } else {
            attachSignin(document.getElementById('loginBtn'), auth2);
        }
    }
    setAuth2();
  }, []);

  useEffect(() => {
    if (!user) {
      const setAuth2 = async () => {
        const auth2 = await loadAuth2(gapi, process.env.REACT_APP_GAUTH_ID, '')
        attachSignin(document.getElementById('loginBtn'), auth2);
      }
      setAuth2();
    }
  }, [user])

  const updateUser = (currentUser) => {
    let profile = currentUser.getBasicProfile()
    const name = profile.getName();
    const profileImg = profile.getImageUrl();
    if (props.userUpdated) { 
        let email = profile.getEmail()
        props.userUpdated(email)
    }
    setUser({
      name: name,
      profileImg: profileImg,
    });
  };

  const attachSignin = (element, auth2) => {
    auth2.attachClickHandler(element, {},
      (googleUser) => {
        updateUser(googleUser);
      }, (error) => {
      console.log(JSON.stringify(error))
    });
  };

  const signOut = () => {
    if (props.userUpdated) { props.userUpdated("") }
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(() => {
      setUser(null);
    //   console.log('User signed out.');
    });
  }

  if(user) {
    return (
        <div className="GloginContainer"> 
            <p>Logged in as: {user['name']}</p>
            <div id="logoutBtn" className="btn" onClick={signOut}>
            Logout
            </div>
        </div>
    );
  }

  return (
    <div className="GloginContainer"> 
      <div className="btn" id="loginBtn">
        Login
      </div>
    </div>
  );
}