"use strict";

/**
 * KidsteamConversationAgent - Dialog Management System
 * 
 * This module implements the conversation state machine for the superhero character "Zip"
 * in the 5-day self-talk skill training program. It manages conversation flow, user response
 * processing, and generates appropriate AI responses based on CSV-defined scripts.
 * 
 * Educational Purpose:
 * - Helps children develop self-talk skills through structured conversations
 * - Provides consistent superhero character interactions across 5 days
 * - Tracks conversation progress and adapts responses based on user input
 * - Uses keyword matching to understand and respond to children's language
 * 
 * Key Features:
 * - CSV-based conversation script engine for easy content management
 * - State machine for conversation flow management and progress tracking
 * - Keyword matching system for natural user response processing
 * - Multi-day conversation support (5 days maximum program length)
 * - Dynamic response generation based on conversation context
 * - Flexible script structure supporting branching conversations
 * 
 * Technical Architecture:
 * - Loads conversation scripts from CSV files at initialization
 * - Maintains conversation state through status tracking
 * - Processes user input through keyword matching algorithms
 * - Generates contextually appropriate responses for the superhero "Zip"
 * - Supports conversation progression through different phases
 * 
 * Created by Vinzenz Aubry for sansho 24.01.17
 * Contact: v@vinzenzaubry.com
 */

// ========================== DEPENDENCIES ========================== //

const csv = require("csv-parse");     // CSV parsing library for conversation scripts
const fs = require("fs");             // File system operations for reading CSV files

// ========================== CONFIGURATION ========================== //

// File paths for conversation data
const conversation_path = "./conversation_script.csv";  // Main conversation flow definitions
const response_path = "./response.csv";                 // User response keyword mappings

// Global data structures for conversation management
var script_states = {};    // Stores conversation scripts organized by day and state
var response_dict = {};    // Stores keyword mappings for user response processing

// ========================== CONVERSATION SCRIPT LOADING ========================== //

/**
 * Load and parse the main conversation script CSV file
 * 
 * This file contains the conversation flow definitions organized by:
 * - Day: Which day of the 5-day program (1-5)
 * - StateID: Which phase of conversation (greeting, 1, 2, 3, 4, finish)
 * - Tag: The AI response text for normal flow
 * - Recovery: Fallback response when user input doesn't match expected keywords
 * - Response-Transition: Maps user responses to next conversation states
 * 
 * Structure: script_states[day][stateID] = { Tag, Recovery, Response-Transition, ... }
 */
fs.readFile(conversation_path, "utf8", function (err, fileData) {
  if (err) {
    console.error("Error reading conversation script file:", err);
    return;
  }
  
  csv.parse(
    fileData.trim(),
    { columns: true, trim: true },  // Use first row as headers, trim whitespace
    function (err, rows) {
      if (err) {
        console.error("Error parsing conversation script CSV:", err);
        return;
      }
      
      // Organize conversation data by day and state for efficient lookup
      for (let row of rows) {
        // Initialize day object if it doesn't exist
        if (script_states[row["Day"]] === undefined) {
          script_states[row["Day"]] = {};
        }
        
        // Store the complete row data for this day and state
        script_states[row["Day"]][row["StateID"]] = row;
      }
      
      console.log("Conversation script loaded successfully");
      console.log(`Loaded scripts for ${Object.keys(script_states).length} days`);
    }
  );
});

/**
 * Load and parse the response keywords CSV file
 * 
 * This file contains keyword mappings that help the system understand user responses:
 * - Response: A response category or identifier
 * - Keywords: Semicolon-separated list of words/phrases that trigger this response
 * 
 * The response_dict maps response categories to arrays of trigger keywords,
 * enabling flexible natural language processing for children's varied language patterns.
 * 
 * Structure: response_dict[responseCategory] = [keyword1, keyword2, ...]
 */
fs.readFile(response_path, "utf8", function (err, fileData) {
  if (err) {
    console.error("Error reading response keywords file:", err);
    return;
  }
  
  csv.parse(
    fileData.trim(),
    { columns: true, trim: true },  // Use first row as headers, trim whitespace
    function (err, rows) {
      if (err) {
        console.error("Error parsing response keywords CSV:", err);
        return;
      }
      
      // Build keyword mapping dictionary for user response processing
      for (let row of rows) {
        // Split keywords by semicolon and clean up whitespace
        response_dict[row["Response"]] = splitNTrim(row["Keywords"], ";");
      }
      
      console.log("Response keywords loaded successfully");
      console.log(`Loaded ${Object.keys(response_dict).length} response categories`);
    }
  );
});

// ========================== UTILITY FUNCTIONS ========================== //

/**
 * Split a string by delimiter and trim whitespace from each part
 * 
 * @param {string} str - String to split and clean
 * @param {string} splitter - Delimiter to split on
 * @returns {Array<string>} Array of trimmed string parts
 * 
 * This utility helps process CSV data where values may have extra whitespace
 * around delimiters, ensuring clean keyword matching.
 */
function splitNTrim(str, splitter) {
  let items = str.trim().split(splitter);
  for (let idx in items) {
    items[idx] = items[idx].trim();
  }
  return items;
}

// ========================== DIALOG MANAGER CLASS ========================== //

/**
 * DialogManager - Main conversation management class
 * 
 * Manages the entire conversation flow for a single user session, including:
 * - Loading and parsing conversation scripts from CSV files
 * - Maintaining conversation state and progress tracking
 * - Processing user responses through keyword matching
 * - Generating appropriate AI responses for the superhero character
 * - Handling conversation transitions and completion
 * 
 * The DialogManager uses a state machine approach where each conversation
 * has specific states (greeting, 1, 2, 3, 4, finish) and transitions between
 * them based on user input and predefined conversation flow.
 */
module.exports = {
  DialogManager: function (day) {
    
    // ========================== INITIALIZATION ========================== //
    
    /**
     * Initialize Dialog Manager for a specific day in the program
     * 
     * @param {number} day - Current day in the 5-day program (1-5)
     */
    this.day = day;                    // Store current day (1-5)
    this.status = "greeting";          // Start with greeting state
    
    console.log(`DialogManager initialized for Day ${day}, Status: ${this.status}`);

    // ========================== GREETING RESPONSE METHOD ========================== //

    /**
     * Get initial greeting responses for the current day
     * 
     * @returns {string} Greeting message for the superhero "Zip"
     * 
     * Retrieves the opening message that the superhero character "Zip"
     * uses to greet the child at the start of each day's conversation session.
     * Different days may have different greeting styles to maintain engagement.
     */
     */
    (this.getGreetingResponse = () => {
      try {
        // Retrieve the greeting response for the current day
        let response = script_states[this.day]["greeting"]["Tag"];
        console.log(`Generated greeting for Day ${this.day}: "${response}"`);
        return response;
      } catch (e) {
        console.error("Error generating greeting response:", e);
        return "Hello! I'm Zip, your superhero friend. Ready for today's adventure?";
      }
    }),

    // ========================== USER RESPONSE PROCESSING METHOD ========================== //

    /**
     * Process user response and generate appropriate AI response
     * 
     * @param {string} userInput - User's text input (from speech-to-text or typing)
     * @returns {string} AI response from the superhero "Zip"
     * 
     * This is the core conversation processing method that:
     * 1. Cleans and normalizes user input for consistent processing
     * 2. Analyzes the user's response for keywords and intent
     * 3. Determines the appropriate AI response based on conversation state
     * 4. Updates conversation status for progression through phases
     * 5. Returns contextually appropriate responses from the superhero "Zip"
     * 
     * The method handles different conversation phases and uses keyword matching
     * to understand children's natural language patterns.
     */
      (this.getResponse = (userInput) => {
        try {
          console.log(`Processing user input: "${userInput}" [Day: ${this.day}, Status: ${this.status}]`);
          
          // ========================== INPUT CLEANING AND NORMALIZATION ========================== //
          
          // Clean user input: remove punctuation and convert to lowercase for consistent matching
          // This helps handle children's varied spelling and punctuation patterns
          let userinput = userInput
            .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g, "")
            .toLowerCase();
          
          console.log(`Normalized input: "${userinput}"`);

          // ========================== CONVERSATION FLOW LOGIC ========================== //
          
          // Get current conversation script entry for this day and status
          let cur_script = script_states[this.day][this.status];
          
          if (!cur_script) {
            console.error(`No script found for Day ${this.day}, Status ${this.status}`);
            return "I'm having trouble understanding. Could you try again?";
          }
          
          // Parse response-transition mappings from the script
          // Format: "response1-nextState1;response2-nextState2;na-fallbackState"
          let res_trans = splitNTrim(cur_script["Response-Transition"], ";");
          console.log("Response-transition mappings:", res_trans);
          
          let transitions = [];       // Will store [keywords_array, next_state] pairs
          let na_response = false;   // Flag for "accept any response" mode

          // ========================== TRANSITION MAPPING CREATION ========================== //
          
          // Create keyword-to-transition mappings from the script configuration
          for (let res_tran of res_trans) {
            let tmp = res_tran.split("-"); // Split "response-transition" format
            
            if (tmp[0] != "na") {
              // Normal keyword-based response: map keywords to next state
              // response_dict[tmp[0]] contains the keywords for this response category
              transitions.push([response_dict[tmp[0]] || [], tmp[1]]);
            } else {
              // "na" response: accept any non-empty input and transition
              transitions.push([[], tmp[1]]);
              na_response = true;
              break; // na response takes precedence
            }
          }
          
          console.log("Processed transitions:", transitions);

          // ========================== KEYWORD MATCHING AND STATE TRANSITION ========================== //
          
          let next_state = this.status;      // Default: stay in current state
          let response_succeeded = false;    // Track if we found a valid transition

          if (na_response) {
            // Accept any non-empty response mode
            if (userinput.length > 0) {
              next_state = transitions[0][1];
              response_succeeded = true;
              console.log("NA response mode: accepting any input, transitioning to", next_state);
            }
          } else {
            // Keyword matching mode: find the earliest matching keyword in user input
            let index_matches = []; // Will store [match_index, next_state] pairs
            
            console.log("Checking keyword matches for input:", userinput);
            
            // Check each transition's keywords against user input
            for (let trans of transitions) {
              let keywords = trans[0];      // Array of keywords for this transition
              let next_transition = trans[1]; // Next state for this transition
              
              // Check each keyword in this transition
              for (let phrase of keywords) {
                let index = userinput.indexOf(phrase.toLowerCase());
                console.log(`Checking keyword "${phrase}": index ${index}`);
                
                if (index >= 0) {
                  // Found a match: store the position and transition
                  index_matches.push([index, next_transition]);
                }
              }
            }
            
            // Sort matches by position to find the earliest keyword match
            // This handles cases where multiple keywords appear in the input
            index_matches.sort((a, b) => a[0] - b[0]);
            
            if (index_matches.length > 0) {
              // Use the earliest matching keyword's transition
              next_state = index_matches[0][1];
              response_succeeded = true;
              console.log("Keyword match found, transitioning to:", next_state);
              console.log("All matches:", index_matches);
            } else {
              console.log("No keyword matches found, staying in current state");
            }
          }

          // ========================== RESPONSE GENERATION ========================== //
          
          // Update conversation state for next interaction
          this.status = next_state;
          
          // Choose response type: normal flow or recovery message
          let speech_key = response_succeeded ? "Tag" : "Recovery";
          
          // Get the AI response from the script
          let response = script_states[this.day][this.status][speech_key];
          
          if (!response) {
            // Fallback if no response found in script
            response = response_succeeded 
              ? "That's great! Let's continue our conversation."
              : "I didn't quite understand that. Could you try saying it differently?";
          }
          
          console.log(`Generated response: "${response}" [${speech_key}]`);
          console.log(`New status: ${this.status}`);
          
          return response;
          
        } catch (e) {
          console.error("Error in getResponse:", e);
          return "I'm having some trouble right now. Could you try again?";
        }
      });
  },
};

/**
 * ========================== MODULE EXPORTS AND USAGE ========================== //
 * 
 * Export DialogManager class for use in main application
 * 
 * This allows the main app.js server to create DialogManager instances
 * for each user session and manage their individual conversation flows.
 * 
 * Usage Example:
 * 
 * const { DialogManager } = require('./conversation');
 * 
 * // Create dialog manager for day 3 of the program
 * const dm = new DialogManager(3);
 * 
 * // Get greeting responses
 * const greetings = dm.getGreetingResponse();
 * 
 * // Process user response
 * const aiResponse = dm.getResponse("Hello Zip!");
 * 
 * // Check conversation status
 * console.log("Current status:", dm.status);
 * console.log("Current day:", dm.day);
 * 
 * Conversation Flow Overview:
 * 
 * 1. GREETING: Initial welcome and introduction
 * 2. STATE 1: Basic interaction and engagement
 * 3. STATE 2: Deeper conversation development
 * 4. STATE 3: Skill application and practice
 * 5. STATE 4: Conversation mastery demonstration
 * 6. FINISH: Session completion and transition
 * 
 * Each state uses keyword matching to understand user responses and 
 * provides appropriate superhero character responses to guide the
 * educational conversation forward.
 */
