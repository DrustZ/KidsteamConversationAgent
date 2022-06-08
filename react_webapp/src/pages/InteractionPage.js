import React from 'react';
import Avatar from '../components/Avatar';

export default function InteractionPage(props) {
  return (
    <main>
      <Avatar isSpeaking={props.botSpeaking} class={"superhero"} src="/img/s_profile.png"/>
      <Avatar isSpeaking={!props.botSpeaking} class={"user"} src="/img/k_profile.png"/>
    </main>
  );
}
