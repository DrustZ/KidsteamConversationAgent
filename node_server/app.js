"use strict";

/**
 * KidsteamConversationAgent - Node.js Backend Server
 * 
 * This is the main server application for a conversational AI system designed for children
 * to interact with a superhero character named "Zip" as part of a 5-day self-talk skill 
 * training program.
 * 
 * Key Features:
 * - Real-time speech processing using Google Cloud Speech-to-Text
 * - AI-generated voice responses using Google Cloud Text-to-Speech
 * - WebSocket communication with React frontend via Socket.IO
 * - Conversation state management through DialogManager
 * - Audio recording and transcript storage on AWS S3
 * - User progress tracking in AWS DynamoDB
 * - Multi-day conversation program support (5 days max)
 * 
 * Created by Vinzenz Aubry for sansho 24.01.17
 * Contact: v@vinzenzaubry.com
 * Feel free to improve!
 */

// ========================== DEPENDENCIES ========================== //

// Custom modules for conversation management and utilities
const utils = require("./util");                    // AWS S3/DynamoDB operations, file management
const DialogManager = require("./conversation").DialogManager; // Conversation state machine

// Core Node.js modules
const fs = require("fs");                           // File system operations
const https = require("http");                      // HTTP server (could be HTTPS in production)

// Express.js for web server functionality
const express = require("express");

// Environment configuration (loads .env file)
const environmentVars = require("dotenv").config();

// Audio file processing
const WavFileWriter = require("wav").FileWriter;    // WAV file creation for recordings

// Google Cloud Speech Services
const speech = require("@google-cloud/speech");     // Speech-to-Text API
const speechClient = new speech.SpeechClient();     // STT client instance

// Google Cloud Text-to-Speech Services
const textToSpeech = require("@google-cloud/text-to-speech");
const ttsclient = new textToSpeech.TextToSpeechClient(); // TTS client instance

// ========================== SERVER SETUP ========================== //

const app = express();

// Basic health check endpoint
app.get("/", (req, res) => {
  res.send("Hello HTTPS!");
});

// Server port configuration (environment variable or default)
const port = process.env.PORT || 1337;

// Create HTTPS server (SSL configuration commented out for development)
const server = https.createServer(
  {
    // Production SSL configuration (uncomment for HTTPS):
    // key: fs.readFileSync('./ssl_keys/privkey.pem'),
    // cert: fs.readFileSync('./ssl_keys/fullchain.pem'),
    // ca: fs.readFileSync('./ssl_keys/chain.pem'),
  },
  app
);

// Initialize Socket.IO for real-time communication with React frontend
const io = require("socket.io")(server, {
  rejectUnauthorized: false,  // Allow self-signed certificates in development
});

// ========================== FILE SYSTEM SETUP ========================== //

// Directory paths for storing audio recordings and conversation transcripts
const recording_dir = "./recordings";    // Temporary storage for WAV audio files
const text_dir = "./transcriptions";     // Temporary storage for conversation logs

// Create directories if they don't exist
if (!fs.existsSync(recording_dir)) {
  fs.mkdirSync(recording_dir);
}
if (!fs.existsSync(text_dir)) {
  fs.mkdirSync(text_dir);
}

// ========================== GLOBAL VARIABLES ========================== //

// Maximum number of days in the conversation program
const maxDay = 5;

// Reference to the sentiment analysis client (Python service)
var classification_client;

// ========================== SOCKET.IO CONNECTION HANDLING ========================== //

/**
 * Main Socket.IO connection handler
 * Manages individual client connections and their conversation sessions
 */
io.on("connection", function (client) {
  console.log("Client Connected to server");
  
  // ========================== CLIENT SESSION VARIABLES ========================== //
  
  // File stream handlers for audio recording and text logging
  let outputFileStream = null;      // WAV file writer for audio recording
  let recognizeStream = null;       // Google Cloud Speech recognition stream
  let textloggerStream = null;      // Text file writer for conversation logs

  // User session data
  let day = 0;                      // Current day in the 5-day program (1-5)
  let sameday = false;             // Whether user is continuing same day session
  let clientID;                    // Unique user identifier (email)

  // File naming variables
  let recording_fname = "";        // Current audio recording filename
  let log_fname = "";             // Current conversation log filename
  let dm;                         // DialogManager instance for conversation state

  // ========================== CLIENT EVENT HANDLERS ========================== //

  /**
   * Handle client type identification
   * Special handling for sentiment analysis client (Python service)
   */
  client.on("join", function (data) {
    if (data === "sentiment") {
      classification_client = client;
      console.log("Sentiment analysis client connected");
    }
  });

  /**
   * Handle user login and session initialization
   * Sets up user's conversation day and dialog manager
   * 
   * @param {string} cid - Client ID (user email from Google OAuth)
   */
  client.on("userLogin", function (cid) {
    clientID = cid;
    console.log("User logged in with ID:", clientID);
    
    // Clean up any cached files from previous sessions
    utils.deleteDirFilesWithPrefix(cid, recording_dir + "/");
    utils.deleteDirFilesWithPrefix(cid, text_dir + "/");

    // Determine user's current day in the program
    utils.getDayOfUser(cid, (user_day, same_day) => {
      day = user_day;
      sameday = same_day;
      console.log(`[User: ${cid}, Day: ${day}, Same Day: ${sameday}]`);
      
      // Initialize dialog manager for the user's current day
      dm = new DialogManager(day);
      console.log("[Day of user]", day, sameday);
      
      // Send user's day information to frontend
      client.emit("userday", { day: day, sameday: same_day });
      
      // Generate and send greeting responses for the day
      let greetings = dm.getGreetingResponse();
      client.emit("greetingResponse", { replies: greetings });
    });
  });

  /**
   * Handle user text responses during conversation
   * Processes user input through dialog manager and returns AI responses
   * 
   * @param {Object} data - Contains user's text response
   */
  client.on("userResponse", function (data) {
    let res = getResponses(data);
    client.emit("assistantResponse", { 
      replies: res[0],        // Array of response texts
      changeStatus: res[1]    // Status change indicator
    });
  });

  /**
   * Handle text-to-speech requests
   * Converts text to audio using Google Cloud TTS
   * 
   * @param {Object} data - Contains text to be converted to speech
   */
  client.on("speechText", (data) => {
    generateAudios([data["text"]]).then((audios) => {
      client.emit("textaudio", { 
        audios: audios[0],           // Generated audio data
        replies: [data["text"]]      // Original text
      });
    });
  });

  /**
   * Handle client disconnection
   * Clean up resources and upload files to S3
   */
  client.on("disconnect", () => {
    console.log("Client disconnected");
    closeStreamNUpload();
  });

  /**
   * Handle explicit client leave event
   * Clean up resources when user leaves the page
   */
  client.on("clientleave", (data) => {
    console.log("Client leaving page");
    closeStreamNUpload();
  });

  /**
   * Clean up file streams and upload conversation logs to S3
   * Called when user session ends
   */
  function closeStreamNUpload() {
    // Close text logging stream if active
    if (textloggerStream) {
      textloggerStream.end();
      textloggerStream = null;
    }
    
    // Upload conversation log to S3 and delete local copy
    if (log_fname) {
      utils.uploadFileToS3NDelete(text_dir + "/" + log_fname, log_fname);
    }
  }

  /**
   * Start Google Cloud Speech recognition stream
   * Initializes audio recording and speech-to-text processing
   */
  client.on("startGoogleCloudStream", function (data) {
    startRecognitionStream(this);
    
    // Ensure dialog manager is initialized
    if (dm === undefined) {
      console.error("Dialog manager not initialized");
      return;
    }
    
    // Generate unique filename for audio recording
    recording_fname = `${clientID}-day${day}-${dm.status}-${utils.getTimeStamp()}.wav`;
    
    // Initialize WAV file writer for audio recording
    outputFileStream = new WavFileWriter(
      recording_dir + "/" + recording_fname,
      {
        sampleRate: 16000,    // Standard sample rate for speech recognition
        bitDepth: 16,         // 16-bit audio quality
        channels: 1,          // Mono audio
      }
    );
    
    console.log("Started recording:", recording_fname);
  });

  /**
   * Stop Google Cloud Speech recognition stream
   * Finalizes audio recording and uploads to S3
   */
  client.on("endGoogleCloudStream", function (data) {
    // Close audio file stream
    if (outputFileStream) {
      outputFileStream.end();
    }
    outputFileStream = null;
    
    // Stop speech recognition stream
    stopRecognitionStream();
    
    // Ensure dialog manager is initialized
    if (dm === undefined) {
      console.error("Dialog manager not initialized during stream end");
      return;
    }
    
    // Upload audio recording to S3 and delete local copy
    console.log("Uploading recording:", recording_fname);
    utils.uploadFileToS3NDelete(
      recording_dir + "/" + recording_fname,
      recording_fname
    );
  });

  /**
   * Handle incoming binary audio data from client
   * Writes audio data to both local file and Google Cloud Speech stream
   * 
   * @param {Buffer} data - Binary audio data from client's microphone
   */
  client.on("binaryData", function (data) {
    // Write audio data to local WAV file
    if (outputFileStream) {
      outputFileStream.write(data);
    }
    
    // Send audio data to Google Cloud Speech recognition stream
    if (recognizeStream !== null) {
      recognizeStream.write(data);
    }
  });

  // ========================== RESPONSE PROCESSING ========================== //

  /**
   * Process user responses through dialog manager and generate AI responses
   * Handles conversation logging, state management, and session completion
   * 
   * @param {Object} data - User response data
   * @returns {Array} [responses, changeStatus] - AI responses and status change
   */
  function getResponses(data) {
    let responses = [];
    let changeStatus = ""; // Status change indicator for frontend

    // Check if dialog manager is properly initialized
    if (dm === undefined || day === 0) {
      responses = ["Connection lost. Please refresh the page to restart."];
      return [responses, changeStatus];
    }

    // Initialize conversation log file if not already created
    if (textloggerStream === null) {
      log_fname = `${clientID}_day${day}_${utils.getTimeStamp()}.txt`;
      
      // Create empty file and open write stream
      fs.closeSync(fs.openSync(text_dir + "/" + log_fname, "w"));
      textloggerStream = fs.createWriteStream(text_dir + "/" + log_fname, {
        flags: "a", // Append mode to preserve existing data
      });
      
      // Write session header
      textloggerStream.write(`START DAY ${day}\n`);
      console.log("Created conversation log:", log_fname);
    }

    // Process user response through dialog manager
    let dmresponse = dm.getResponse(data["response"]);
    responses = dmresponse.split(";"); // Multiple responses separated by semicolons

    // Log conversation exchange
    textloggerStream.write(`user:\t${data["response"]}\n`);
    textloggerStream.write(`da:\t${dmresponse}\n`);

    // Handle conversation milestone: when status reaches "4", log conversation start
    if (dm.status === "4") {
      console.log("Conversation milestone reached - status 4");
      utils.finishConversation(clientID, day);
    }

    // Handle conversation completion
    if (dm.status === "finish") {
      console.log("Conversation finished for user:", clientID);
      changeStatus = "finish";
      
      // Finalize conversation log
      textloggerStream.write(`FINISH\n`);
      textloggerStream.end();
      textloggerStream = null;
      
      // Upload final conversation log to S3
      utils.uploadFileToS3NDelete(text_dir + "/" + log_fname, log_fname);
    }

    // Handle transition to interaction phase
    if (dm.status === "1") {
      changeStatus = "interaction";
    }

    console.log(`Status: ${dm.status}, Client: ${clientID}, Day: ${day}`);
    return [responses, changeStatus];
  }

  // ========================== SPEECH RECOGNITION STREAM MANAGEMENT ========================== //

  /**
   * Initialize Google Cloud Speech recognition stream
   * Sets up real-time speech-to-text processing with automatic restart on completion
   * 
   * @param {Object} client - Socket.IO client instance
   */
  function startRecognitionStream(client) {
    try {
      recognizeStream = speechClient
        .streamingRecognize(request)
        .on("error", (error) => {
          console.error("Speech recognition error:", error);
        })
        .on("data", (data) => {
          // Send transcription data to client
          client.emit("speechData", data);

          // Auto-restart stream when utterance is complete
          // This prevents the 65-second timeout limit issue
          if (data.results[0] && data.results[0].isFinal) {
            console.log("Final transcription received, restarting stream");
            stopRecognitionStream();
            startRecognitionStream(client);
          }
        });
      
      console.log("Speech recognition stream started");
    } catch (error) {
      console.error("Failed to start recognition stream:", error);
    }
  }

  /**
   * Stop Google Cloud Speech recognition stream
   * Cleanly closes the streaming connection
   */
  function stopRecognitionStream() {
    if (recognizeStream) {
      recognizeStream.end();
      console.log("Speech recognition stream stopped");
    }
    recognizeStream = null;
  }
});

// ========================== GOOGLE CLOUD TEXT-TO-SPEECH ========================== //

/**
 * Generate audio from text using Google Cloud Text-to-Speech
 * 
 * @param {string} text - Text to be converted to speech
 * @returns {Buffer} Audio content as binary data
 */
async function generateAudio(text) {
  // Configure TTS request
  const request = {
    input: { text: text },
    voice: { 
      languageCode: "en-US",      // English (US) voice
      ssmlGender: "NEUTRAL"       // Gender-neutral voice
    },
    audioConfig: { 
      audioEncoding: "MP3"        // MP3 audio format for web compatibility
    },
  };

  try {
    // Perform text-to-speech conversion
    const [response] = await ttsclient.synthesizeSpeech(request);
    console.log("Generated audio for text:", text.substring(0, 50) + "...");
    return response.audioContent;
  } catch (error) {
    console.error("TTS generation failed:", error);
    throw error;
  }
}

/**
 * Generate multiple audio files from array of text strings
 * 
 * @param {Array<string>} texts - Array of text strings to convert
 * @returns {Array<Buffer>} Array of audio content buffers
 */
async function generateAudios(texts) {
  let audios = [];
  
  for (let text of texts) {
    try {
      let audio = await generateAudio(text);
      audios.push(audio);
    } catch (error) {
      console.error(`Failed to generate audio for: ${text}`);
      audios.push(null); // Push null for failed generations
    }
  }
  
  console.log(`Generated ${audios.length} audio files`);
  return audios;
}

// ========================== GOOGLE CLOUD SPEECH-TO-TEXT CONFIG ========================== //

/**
 * Google Cloud Speech-to-Text configuration
 * Optimized for real-time conversation recognition
 */
const encoding = "LINEAR16";          // PCM 16-bit encoding
const sampleRateHertz = 16000;       // 16kHz sample rate (standard for speech)
const languageCode = "en-US";        // English (US) language model

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,           // Allow all speech content
    enableWordTimeOffsets: true,      // Provide timing information for words
    // speechContexts: [{              // Optional: Add custom vocabulary
    //     phrases: ["hoful","shwazil"] // Custom words for better recognition
    // }]
  },
  interimResults: true, // Enable real-time partial results
};

// ========================== SERVER STARTUP ========================== //

/**
 * Start the HTTP server and begin listening for connections
 */
server.listen(port, function () {
  console.log("=".repeat(50));
  console.log("🚀 KidsteamConversationAgent Server Started");
  console.log("=".repeat(50));
  console.log(`📍 Server running on port: ${port}`);
  console.log(`🕒 Started at: ${new Date().toISOString()}`);
  console.log(`🎯 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log("=".repeat(50));
  console.log("Ready to accept client connections...");
});
