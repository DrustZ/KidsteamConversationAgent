import React from "react";
import DiamondList from "../components/DiamondList";

export default function ReminderPage(props) {
  const ordinalDays = ["first", "second", "third", "fourth", "fifth"];
  var dayNum;
  if (props.day == 9) {
    dayNum = 1;
  } else {
    dayNum = props.day;
  }

  return (
    <main className="reminder">
      {/* create diamond with day number in it */}
      <div className="diamond-day">
        <img
          src="/img/diamond-day.png"
          alt="diamond showing the interaction day"
        />

        <div className="day-text">{dayNum}</div>
      </div>
      <DiamondList day={dayNum} />
      <h1>This is the {ordinalDays[dayNum - 1]} day!</h1>
      {/* <p>This is the {ordinalDays[dayNum - 1]} day!</p>*/}
    </main>
  );
}