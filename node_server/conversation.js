const csv = require("csv-parse");
const fs = require("fs");

const conversation_path = "./conversation_script.csv";
const response_path = "./response.csv";
var script_states = {};
var response_dict = {};

fs.readFile(conversation_path, "utf8", function (err, fileData) {
  csv.parse(
    fileData.trim(),
    { columns: true, trim: true },
    function (err, rows) {
      // Your CSV data is in an array of arrys passed to this callback as rows.
      for (let row of rows) {
        if (script_states[row["Day"]] === undefined) {
          script_states[row["Day"]] = {};
        }
        script_states[row["Day"]][row["StateID"]] = row;
      }
    }
  );
});

fs.readFile(response_path, "utf8", function (err, fileData) {
  csv.parse(
    fileData.trim(),
    { columns: true, trim: true },
    function (err, rows) {
      // Your CSV data is in an array of arrys passed to this callback as rows.
      for (let row of rows) {
        response_dict[row["Response"]] = splitNTrim(row["Keywords"], ";");
      }
      // console.log(response_dict);
    }
  );
});

function splitNTrim(str, splitter) {
  let items = str.trim().split(splitter);
  for (let idx in items) {
    items[idx] = items[idx].trim();
  }
  return items;
}

module.exports = {
  DialogManager: function (day) {
    this.day = day;
    this.status = "greeting";
    (this.getGreetingResponse = () => {
      try {
        let response = script_states[this.day]["greeting"]["Tag"];
        return response;
      } catch (e) {
        console.log(e);
        return "";
      }
    }),
      (this.getResponse = (userInput) => {
        try {
          let userinput = userInput
            .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g, "")
            .toLowerCase();
          let cur_script = script_states[this.day][this.status];
          let res_trans = splitNTrim(cur_script["Response-Transition"], ";");
          // console.log("res-transition is: ", res_trans);
          let transitions = [];

          let na_response = false;
          // create all response - transition maps
          for (let res_tran of res_trans) {
            let tmp = res_tran.split("-"); //response - transition
            if (tmp[0] != "na") {
              // [no, 2_1_1]
              transitions.push([response_dict[tmp[0]], tmp[1]]);
            } else {
              transitions.push([[], tmp[1]]);
              na_response = true;
              break;
            }
          }
          // console.log("next state is: ", transitions);
          // try to match key words
          let next_state = this.status;
          let response_succeed = false;
          // na response, accept any nonempty response
          if (na_response) {
            if (userinput.length > 0) {
              next_state = transitions[0][1]; // get next state
              response_succeed = true;
            }
          } else {
            let index_matches = [];
            // we try to find the first index if the response matches in the userinput
            // then compare to extract the first matched response
            // console.log("not na response, transitions is: ", transitions);
            console.log("user input: ", userinput);
            for (let trans of transitions) {
              // trans: [reponses, transition]
              for (let phrase of trans[0]) {
                let index = userinput.indexOf(phrase);
                console.log("index is: ", index);
                if (index >= 0) {
                  // push (index, nexttransition)
                  index_matches.push([index, trans[1]]);
                }
              }
            }
            index_matches.sort((a, b) => {
              return a[0] - b[0];
            });
            if (index_matches.length > 0) {
              console.log("index_maches is : ", index_matches);
              next_state = index_matches[0][1];
              console.log("next state for testing is: ", next_state);
              response_succeed = true;
            } // else ????
          }

          this.status = next_state;
          let speech_key = "Tag";
          if (!response_succeed) {
            speech_key = "Recovery";
          }

          let response = script_states[this.day][this.status][speech_key];
          // console.log(`Uinput: ${userinput} \t Response: ${response}`)
          return response;
        } catch (e) {
          console.log(e);
          return "";
        }
      });
  },
};
