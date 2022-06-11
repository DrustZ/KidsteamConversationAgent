import React from 'react';
import Avatar from '../components/Avatar';

export default function InteractionPage(props) {
  return (
    <main>
      <div className="profiles">
        <Avatar isSpeaking={props.botSpeaking} src="/img/s_profile.png" />
        <Avatar isSpeaking={!props.botSpeaking} src="/img/kid_speaking.png" />
      </div>

    </main>
  );
}
