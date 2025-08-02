# KidsteamConversationAgent - Complete Technical Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Database Structure](#database-structure)
4. [API Documentation](#api-documentation)
5. [Frontend Components](#frontend-components)
6. [Conversation System](#conversation-system)
7. [Audio Processing](#audio-processing)
8. [File Management](#file-management)
9. [Deployment & Setup](#deployment--setup)
10. [Development Guide](#development-guide)

---

## 🎯 Project Overview

The **KidsteamConversationAgent** is an educational technology application designed to help children develop self-talk skills through interactive conversations with a superhero character named "Zip". This system is part of a structured 5-day training program that combines storytelling, speech recognition, and AI-powered responses to create an engaging learning experience.

### Educational Purpose
- **Target Audience**: Children learning self-talk skills
- **Program Duration**: 5 days maximum
- **Core Learning**: Self-talk strategies through superhero narratives
- **Interaction Method**: Voice-based conversations with AI character

### Key Features
- Real-time speech-to-text processing using Google Cloud Speech API
- AI-generated voice responses using Google Cloud Text-to-Speech
- WebSocket-based real-time communication between frontend and backend
- User progress tracking through AWS DynamoDB
- Audio recording storage in AWS S3
- Multi-day conversation program support
- Google OAuth authentication

---

## 🏗️ Architecture & Technology Stack

### Overall System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Web     │    │   Node.js       │    │   Google Cloud  │
│   Frontend      │◄──►│   Backend       │◄──►│   Speech APIs   │
│   (Client)      │    │   (Server)      │    │   (STT/TTS)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐              
│   Browser       │    │   AWS Services  │              
│   AudioContext  │    │   S3 + DynamoDB │              
│   (Recording)   │    │   (Storage)     │              
└─────────────────┘    └─────────────────┘              
```

### Technology Stack

#### Backend (Node.js Server)
- **Runtime**: Node.js with Express.js framework
- **Real-time Communication**: Socket.IO for WebSocket connections
- **Speech Processing**: Google Cloud Speech-to-Text API
- **Voice Synthesis**: Google Cloud Text-to-Speech API
- **Database**: AWS DynamoDB for user progress tracking
- **File Storage**: AWS S3 for audio recordings and transcripts
- **Audio Processing**: WAV file handling for recording storage
- **Environment Configuration**: dotenv for secure credential management

#### Frontend (React Application)
- **Framework**: React 18.1.0 with functional components and hooks
- **Routing**: React Router DOM for navigation
- **Real-time Communication**: Socket.IO client for server communication
- **Audio Recording**: Web Audio API with AudioContext
- **Authentication**: Google OAuth integration
- **State Management**: React hooks (useState, useEffect) with useStateRef

#### Cloud Services
- **Google Cloud Platform**:
  - Speech-to-Text API for voice recognition
  - Text-to-Speech API for voice generation
- **Amazon Web Services**:
  - S3 for audio file and transcript storage
  - DynamoDB for user session and progress data

### Project Structure
```
KidsteamConversationAgent/
├── node_server/                 # Backend Node.js application
│   ├── app.js                  # Main server file with Socket.IO setup
│   ├── conversation.js         # Dialog management and conversation logic
│   ├── util.js                 # AWS operations and utility functions
│   ├── conversation_script.csv # Conversation flow definitions
│   ├── response.csv           # Keyword mapping for user responses
│   ├── recordings/            # Temporary audio file storage
│   └── transcriptions/        # Temporary transcript storage
├── react_webapp/               # Frontend React application
│   ├── src/
│   │   ├── App.js             # Main app component with state management
│   │   ├── AudioService.js    # Audio recording and playback services
│   │   ├── components/        # Reusable UI components
│   │   └── pages/             # Page-specific React components
│   └── public/                # Static assets and audio files
└── classification_client/      # Sentiment analysis service (Python)
```

---

## 🗄️ Database Structure

### AWS DynamoDB Schema

#### Table: `kidscaskill`
**Purpose**: Track user progress through the 5-day conversation program

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `uid` | String (Primary Key) | User identifier from Google OAuth email | `user@example.com` |
| `user_history` | String | Semicolon-separated completion records | `1:2022_07_01-14_30_25;2:2022_07_02-15_45_10` |

#### User History Format
Each completion is recorded as: `{day}:{timestamp}`
- **Day**: Which day in the program (1-5)
- **Timestamp**: Completion time in format `YYYY_MM_DD-HH_MM_SS`

#### Example Data Flow
```javascript
// New user - no record exists
user_history: undefined

// After completing Day 1
user_history: "1:2022_07_01-14_30_25"

// After completing Day 2  
user_history: "1:2022_07_01-14_30_25;2:2022_07_02-15_45_10"

// Same day as Day 2 - user can repeat
user_history: "1:2022_07_01-14_30_25;2:2022_07_02-15_45_10" (unchanged)
```

### AWS S3 Storage Structure

#### Bucket: `kidsrecording`
**Purpose**: Store audio recordings and conversation transcripts

```
kidsrecording/
├── user@example.com-day1-greeting-2022_07_01-14_30_25.wav
├── user@example.com-day1-conversation-2022_07_01-14_32_15.wav
├── user@example.com_day1_2022_07_01-14_30_25.txt
└── user@example.com-day2-greeting-2022_07_02-15_45_10.wav
```

#### File Naming Convention
- **Audio Files**: `{userId}-day{day}-{status}-{timestamp}.wav`
- **Transcripts**: `{userId}_day{day}_{timestamp}.txt`

---

## 🔌 API Documentation

### WebSocket Events (Socket.IO)

The application uses WebSocket communication for real-time interaction between the React frontend and Node.js backend.

#### Client → Server Events

##### `join`
**Purpose**: Identify client type for special handling
```javascript
socket.emit("join", "sentiment"); // For sentiment analysis client
```

##### `userLogin`
**Purpose**: Authenticate user and initialize session
```javascript
socket.emit("userLogin", "user@example.com");
```
- **Parameter**: User email from Google OAuth
- **Response**: Triggers `userday` event with user's current day

##### `userResponse`  
**Purpose**: Send user's text response during conversation
```javascript
socket.emit("userResponse", {
  uid: "user@example.com",
  response: "Hello Zip, I'm ready!"
});
```
- **Response**: Triggers `assistantResponse` with AI reply

##### `speechText`
**Purpose**: Request text-to-speech conversion
```javascript
socket.emit("speechText", {
  text: "Hello, this is Zip speaking!"
});
```
- **Response**: Triggers `textaudio` with generated audio

##### `startGoogleCloudStream`
**Purpose**: Begin speech recognition for audio recording
```javascript
socket.emit("startGoogleCloudStream", userEmail);
```

##### `endGoogleCloudStream`
**Purpose**: Stop speech recognition and finalize recording
```javascript
socket.emit("endGoogleCloudStream", "");
```

##### `binaryData`
**Purpose**: Stream audio data from microphone to speech recognition
```javascript
socket.emit("binaryData", audioBuffer);
```
- **Parameter**: Binary audio data (Int16Array)

#### Server → Client Events

##### `userday`
**Purpose**: Inform client of user's current day and session status
```javascript
socket.on("userday", (data) => {
  // data = { day: 2, sameday: false }
});
```

##### `greetingResponse`
**Purpose**: Send initial greeting responses for the day
```javascript
socket.on("greetingResponse", (responses) => {
  // responses = { replies: "Welcome to day 2..." }
});
```

##### `assistantResponse`
**Purpose**: Send AI-generated responses during conversation
```javascript
socket.on("assistantResponse", (responses) => {
  // responses = { 
  //   replies: ["Great answer!", "Let's continue..."],
  //   changeStatus: "interaction" 
  // }
});
```

##### `speechData`
**Purpose**: Real-time speech recognition results
```javascript
socket.on("speechData", (data) => {
  // data = Google Cloud Speech API response
  // data.results[0].alternatives[0].transcript
});
```

##### `textaudio`
**Purpose**: Generated audio from text-to-speech
```javascript
socket.on("textaudio", (data) => {
  // data = { audios: audioBuffer, replies: ["Text that was spoken"] }
});
```

---

## 🎨 Frontend Components

### App.js - Main Application Controller
**Location**: `react_webapp/src/App.js`

This is the central component that manages the entire application state and coordinates all interactions.

#### Key State Variables
```javascript
const [day, setDay] = useState(1);                    // Current day (1-5)
const [issameday, setIsSameDay] = useState(false);    // Same day as last session
const [userEmail, setUserEmail] = useState("");      // User's Google email
const [showmic, setShowMic] = useState(false);       // Show microphone button
const [miclistening, setMicListening] = useState(false); // Mic is recording
const [audioplaying, setAudioPlaying] = useState(false); // Audio is playing
const [currentpage, setCurrentPage] = useState(<OnboardingPage />); // Current page
const [appState, setAppState] = useState("onboarding"); // App state
```

#### Application States
- **`onboarding`**: Initial page with Google login
- **`reminder`**: Brief reminder about the conversation
- **`prompt`**: Instructions before starting conversation
- **`interaction`**: Active conversation with Zip
- **`finish`**: Completion page after conversation ends

#### Key Functions
```javascript
// Handle Google OAuth login
userUpdated(email) // Updates user email and triggers login

// Start conversation flow
onStartBtnClick() // Begins the day's conversation session

// Manage audio recording
startRecording() // Begin microphone recording
stopRecording()  // End recording and send to server
handleMicClick() // Toggle recording state

// Timer management for silence detection
initTimer() // Set up silence detection timers
```

### AudioService.js - Audio Processing
**Location**: `react_webapp/src/AudioService.js`

Handles all audio-related functionality including recording, playback, and WebSocket communication.

#### Core Functions
```javascript
// WebSocket connection to backend
export const socket = socketIOClient("http://localhost:1337");

// Play pre-recorded responses from S3
export var speakResponses = (responses, callback) => {
  let url = `https://superheroaudios.s3.us-west-2.amazonaws.com/${replyTag}.mp3`;
  let audio = new Audio(url);
  audio.addEventListener("ended", () => callback());
  audio.play();
};

// Microphone recording class
export var microphoneRecorder = function() {
  this.startRecording = (userEmail) => {
    // Initialize AudioContext and start recording
  };
  
  this.stopRecording = () => {
    // Stop recording and clean up resources
  };
};
```

#### Audio Processing Pipeline
1. **User speaks** → Microphone captures audio
2. **Audio downsampling** → Convert 44.1kHz to 16kHz for speech recognition
3. **WebSocket streaming** → Send audio chunks to backend
4. **Speech recognition** → Google Cloud processes audio
5. **Response generation** → Backend creates AI response
6. **Text-to-speech** → Convert response to audio
7. **Audio playback** → Play generated audio to user

### Page Components

#### OnboardingPage.js
**Purpose**: Welcome screen with Google authentication
```javascript
export default function OnboardingPage({ isloggedin, onStartBtnClick }) {
  return (
    <main>
      <h1>Welcome to Superhero Self-Talk Training!</h1>
      {isloggedin && <button onClick={onStartBtnClick}>Start Adventure</button>}
    </main>
  );
}
```

#### InteractionPage.js  
**Purpose**: Main conversation interface showing avatars
```javascript
export default function InteractionPage({ botSpeaking }) {
  return (
    <main>
      <div className="profiles">
        <Avatar isSpeaking={botSpeaking} src="/img/s_profile.png" />
        <Avatar isSpeaking={!botSpeaking} src="/img/kid_speaking.png" />
      </div>
    </main>
  );
}
```

#### ReminderPage.js, PromptPage.js, FinishPage.js
Brief transition pages that provide context and instructions between conversation phases.

### Component Hierarchy
```
App
├── OnboardingPage
│   └── GoogleLogin
├── ReminderPage
├── PromptPage  
├── InteractionPage
│   └── Avatar (x2)
├── FinishPage
└── Mic
```

---

## 💬 Conversation System

### Dialog Management Architecture

The conversation system uses a state machine approach implemented in `conversation.js`:

#### DialogManager Class
**Location**: `node_server/conversation.js`

```javascript
const dm = new DialogManager(day); // Initialize for specific day
const greeting = dm.getGreetingResponse(); // Get day's greeting
const response = dm.getResponse(userInput); // Process user input
```

#### Conversation States
Each conversation progresses through these states:
- **`greeting`**: Initial welcome message
- **`0`, `1`, `2`, `3`, `4`**: Progressive conversation phases  
- **`finish`**: Conversation completion

#### CSV-Based Script Engine

##### conversation_script.csv Structure
| Column | Purpose | Example |
|--------|---------|---------|
| Day | Program day (1-5) | 1 |
| StateID | Conversation state | greeting, 1, 2, finish |
| Tag | Normal AI response | "Great answer! Let's continue..." |
| Recovery | Fallback response | "I didn't understand, can you try again?" |
| Response-Transition | Next state mapping | "yes-1;no-2;na-finish" |

##### response.csv Structure  
| Column | Purpose | Example |
|--------|---------|---------|
| Response | Response category | yes, no, dayone |
| Keywords | Trigger words | "yes; yeah; ok; sure" |

#### Keyword Matching Algorithm
```javascript
// 1. Clean user input
let cleanInput = userInput
  .replace(/['!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g, "")
  .toLowerCase();

// 2. Find matching keywords
for (let phrase of keywords) {
  let index = cleanInput.indexOf(phrase.toLowerCase());
  if (index >= 0) {
    // Match found - transition to next state
  }
}

// 3. Use earliest match if multiple keywords found
index_matches.sort((a, b) => a[0] - b[0]);
```

#### Response Generation Flow
```javascript
// 1. Parse transition rules from CSV
let transitions = parseTransitions(script["Response-Transition"]);

// 2. Match user input to keywords  
let nextState = findMatchingTransition(userInput, transitions);

// 3. Update conversation state
this.status = nextState;

// 4. Generate appropriate response
let response = nextState ? script["Tag"] : script["Recovery"];
```

### Educational Conversation Flow

#### Day 1 Example Flow
1. **Greeting**: "Welcome to superhero self-talk skill training..."
2. **State 0**: "If you are ready, say I am ready..."
3. **State 1**: "Great, let's join Zip now. What's your name?"
4. **State 2**: Story about challenges and self-talk introduction
5. **State 3**: Zip helping Lily with lego tower story
6. **State 4**: Practice self-talk techniques
7. **Finish**: Session completion and progress recording

Each day builds upon previous learning with new stories and increasingly complex self-talk scenarios.

---

## 🎵 Audio Processing

### Speech Recognition Pipeline

#### Google Cloud Speech-to-Text Configuration
**Location**: `node_server/app.js:495-507`

```javascript
const request = {
  config: {
    encoding: "LINEAR16",           // PCM 16-bit encoding
    sampleRateHertz: 16000,        // 16kHz sample rate
    languageCode: "en-US",         // English (US) model
    profanityFilter: false,        // Allow all speech content
    enableWordTimeOffsets: true,   // Provide word timing
  },
  interimResults: true,            // Real-time partial results
};
```

#### Audio Recording Process
**Location**: `react_webapp/src/AudioService.js:87-135`

```javascript
// 1. Initialize AudioContext
context = new AudioContext({ latencyHint: "interactive" });

// 2. Create audio processing pipeline
processor = context.createScriptProcessor(bufferSize, 1, 1);
input = context.createMediaStreamSource(stream);
input.connect(processor);

// 3. Process audio chunks
processor.onaudioprocess = function(e) {
  var left = e.inputBuffer.getChannelData(0);
  var left16 = downsampleBuffer(left, 44100, 16000); // Convert to 16kHz
  socket.emit("binaryData", left16); // Send to server
};
```

#### Audio Downsampling Algorithm
```javascript
function downsampleBuffer(buffer, sampleRate, outSampleRate) {
  var sampleRateRatio = sampleRate / outSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Int16Array(newLength);
  
  // Average samples to reduce sample rate
  for (var i = 0; i < result.length; i++) {
    var accum = 0, count = 0;
    var start = Math.round(i * sampleRateRatio);
    var end = Math.round((i + 1) * sampleRateRatio);
    
    for (var j = start; j < end && j < buffer.length; j++) {
      accum += buffer[j];
      count++;
    }
    result[i] = Math.min(1, accum / count) * 0x7fff;
  }
  return result.buffer;
}
```

### Text-to-Speech Generation

#### Google Cloud TTS Configuration  
**Location**: `node_server/app.js:438-460`

```javascript
async function generateAudio(text) {
  const request = {
    input: { text: text },
    voice: { 
      languageCode: "en-US",      // English (US) voice
      ssmlGender: "NEUTRAL"       // Gender-neutral voice
    },
    audioConfig: { 
      audioEncoding: "MP3"        // MP3 for web compatibility
    },
  };
  
  const [response] = await ttsclient.synthesizeSpeech(request);
  return response.audioContent; // Binary audio data
}
```

#### Audio Playback System
**Location**: `react_webapp/src/AudioService.js:16-24`

```javascript
export var speakResponses = (responses, callback) => {
  // Use pre-recorded audio files from S3 for consistent character voice
  let url = `https://superheroaudios.s3.us-west-2.amazonaws.com/${replyTag}.mp3`;
  let audio = new Audio(url);
  audio.addEventListener("ended", () => callback());
  audio.play();
};
```

---

## 📁 File Management

### Local File Operations
**Location**: `node_server/util.js:427-467`

#### Temporary File Cleanup
```javascript
function deleteDirFilesWithPrefix(prefix, dirPath) {
  fs.readdir(dirPath, (err, fileNames) => {
    for (const name of fileNames) {
      if (name.startsWith(prefix)) {
        fs.unlink(dirPath + name, (err) => {
          console.log(`Deleted: ${name}`);
        });
      }
    }
  });
}
```

### AWS S3 Integration
**Location**: `node_server/util.js:282-334`

#### Upload and Cleanup Process
```javascript
function uploadFileToS3NDelete(fileName, key) {
  // 1. Read local file
  fs.readFile(fileName, (err, content) => {
    
    // 2. Upload to S3
    const params = {
      Bucket: "kidsrecording",
      Key: key,
      Body: content,
      ContentType: getContentType(key),
    };
    
    s3.upload(params, function(err, data) {
      // 3. Delete local file after successful upload
      fs.unlink(fileName, function(err) {
        console.log(`Uploaded and deleted: ${fileName}`);
      });
    });
  });
}
```

#### Content Type Detection
```javascript
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const contentTypes = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg', 
    'txt': 'text/plain',
    'csv': 'text/csv'
  };
  return contentTypes[ext] || 'application/octet-stream';
}
```

### File Naming Strategy

#### Timestamp Generation
**Location**: `node_server/util.js:375-399`

```javascript
function getTimeStamp(onlydate = false) {
  let d = new Date();
  let curr_date = d.getDate().toString().padStart(2, '0');
  let curr_month = (d.getMonth() + 1).toString().padStart(2, '0');
  let curr_year = d.getFullYear();
  
  if (onlydate) {
    return `${curr_year}_${curr_month}_${curr_date}`;
  }
  
  let curr_hr = d.getHours().toString().padStart(2, '0');
  let curr_min = d.getMinutes().toString().padStart(2, '0');
  let curr_sec = d.getSeconds().toString().padStart(2, '0');
  
  return `${curr_year}_${curr_month}_${curr_date}-${curr_hr}_${curr_min}_${curr_sec}`;
}
```

#### File Organization
```
Recordings: {userId}-day{day}-{status}-{timestamp}.wav
Transcripts: {userId}_day{day}_{timestamp}.txt
Examples:
- user@example.com-day1-greeting-2022_07_01-14_30_25.wav
- user@example.com_day1_2022_07_01-14_30_25.txt
```

---

## 🚀 Deployment & Setup

### Prerequisites
- Node.js 14+ and npm 6+
- Google Cloud Platform account with Speech APIs enabled
- AWS account with S3 and DynamoDB access
- Google OAuth 2.0 credentials for authentication

### Environment Configuration

#### Backend Environment Variables (.env)
```bash
# Google Cloud Credentials
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# AWS Credentials  
AWSAccessKeyId=your_access_key_id
AWSSecretKey=your_secret_access_key

# Server Configuration
PORT=1337
NODE_ENV=production
```

#### Google Cloud Setup
1. Enable Speech-to-Text and Text-to-Speech APIs
2. Create service account and download JSON key
3. Set GOOGLE_APPLICATION_CREDENTIALS environment variable

#### AWS Setup
1. Create S3 bucket named "kidsrecording"
2. Create DynamoDB table named "kidscaskill" with primary key "uid"
3. Configure IAM user with S3 and DynamoDB permissions

### Installation Process

#### 1. Install All Dependencies
```bash
npm run install-all
```
This installs dependencies for:
- Root project
- React frontend (`react_webapp/`)
- Node.js backend (`node_server/`)

#### 2. Start Development Environment
```bash
npm start
```
This concurrently runs:
- Backend server on port 1337
- React development server on port 3000

#### 3. Alternative Start Commands
```bash
# Start only backend
npm run start:server

# Start only frontend  
npm run start:client

# Build for production
npm run build
```

### Production Deployment

#### Backend Deployment
1. Configure SSL certificates (uncomment HTTPS setup in app.js)
2. Set production environment variables
3. Use process manager like PM2:
```bash
pm2 start node_server/app.js --name "conversation-agent"
```

#### Frontend Deployment
1. Build optimized production bundle:
```bash
cd react_webapp && npm run build
```
2. Serve build files with nginx or similar web server
3. Configure proxy to backend API

---

## 🛠️ Development Guide

### Adding New Conversation Days

#### 1. Update CSV Files
Add new entries to `conversation_script.csv`:
```csv
Day,StateID,Tag,Speech,Response-Transition,Recovery
6,greeting,6_g,"Welcome to day 6...",na-0,recovery
6,0,6_0,"Ready for advanced training?",yes-1;no-recovery,recovery
```

#### 2. Add New Keywords (if needed)
Update `response.csv`:
```csv
Response,Keywords
advanced,advanced; difficult; hard; challenging
```

#### 3. Update Day Limits
Modify `node_server/app.js:96`:
```javascript
const maxDay = 6; // Increase from 5 to 6
```

### Creating New Page Components

#### 1. Create Page Component
```javascript
// react_webapp/src/pages/NewPage.js
import React from 'react';

export default function NewPage({ prop1, prop2 }) {
  return (
    <main>
      <h1>New Page Content</h1>
    </main>
  );
}
```

#### 2. Add to App.js State Management
```javascript
// Add new app state
case "newpage":
  setCurrentPage(<NewPage prop1={value1} />);
  break;
```

#### 3. Add Transition Logic
```javascript
// In conversation.js or app.js
if (someCondition) {
  changeStatus = "newpage";
}
```

### Debugging Common Issues

#### Audio Recording Problems
```javascript
// Check browser permissions
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log("Audio access granted"))
  .catch(err => console.error("Audio access denied:", err));

// Verify AudioContext initialization
if (!window.AudioContext && !window.webkitAudioContext) {
  console.error("AudioContext not supported");
}
```

#### WebSocket Connection Issues
```javascript
// Add connection debugging
socket.on("connect", () => console.log("Connected to server"));
socket.on("disconnect", () => console.log("Disconnected from server"));
socket.on("error", (err) => console.error("Socket error:", err));
```

#### Speech Recognition Debugging
```javascript
// Log speech recognition events
recognizeStream
  .on("data", (data) => {
    console.log("Speech data:", data);
    if (data.results[0] && data.results[0].isFinal) {
      console.log("Final transcript:", data.results[0].alternatives[0].transcript);
    }
  })
  .on("error", (error) => {
    console.error("Speech recognition error:", error);
  });
```

### Testing Strategies

#### Unit Testing
```javascript
// Test conversation logic
const dm = new DialogManager(1);
const response = dm.getResponse("yes");
expect(response).toContain("Great");
```

#### Integration Testing  
```javascript
// Test WebSocket communication
const client = require("socket.io-client");
const socket = client("http://localhost:1337");
socket.emit("userLogin", "test@example.com");
```

#### Manual Testing
1. Test each conversation day independently
2. Verify audio recording and playback
3. Check file upload to S3
4. Validate DynamoDB progress tracking

### Performance Optimization

#### Audio Optimization
- Use appropriate sample rates (16kHz for speech)
- Implement audio compression for storage
- Buffer audio chunks efficiently

#### Database Optimization
- Index DynamoDB queries by user ID
- Implement connection pooling for high traffic
- Cache frequently accessed conversation scripts

#### Frontend Optimization
- Lazy load page components
- Implement audio preloading for faster playback
- Use React.memo for expensive components

---

## 🔍 API Reference Quick Guide

### Socket.IO Events Summary

| Event | Direction | Purpose | Data Format |
|-------|-----------|---------|-------------|
| `userLogin` | Client→Server | Authenticate user | `"user@email.com"` |
| `userday` | Server→Client | Send user's day info | `{day: 1, sameday: false}` |
| `userResponse` | Client→Server | Send user input | `{uid: "email", response: "text"}` |
| `assistantResponse` | Server→Client | Send AI response | `{replies: ["text"], changeStatus: "state"}` |
| `startGoogleCloudStream` | Client→Server | Begin recording | `userEmail` |
| `endGoogleCloudStream` | Client→Server | End recording | `""` |
| `binaryData` | Client→Server | Audio data stream | `audioBuffer` |
| `speechData` | Server→Client | Speech recognition | Google Cloud API response |
| `speechText` | Client→Server | TTS request | `{text: "speak this"}` |
| `textaudio` | Server→Client | Generated audio | `{audios: buffer, replies: ["text"]}` |

### Utility Functions Reference

```javascript
// User progress tracking
utils.getDayOfUser(userId, callback)        // Get user's current day
utils.finishConversation(userId, day)       // Record completion

// File operations  
utils.uploadFileToS3NDelete(file, key)      // Upload and cleanup
utils.deleteDirFilesWithPrefix(prefix, dir) // Cleanup by prefix
utils.getTimeStamp(dateOnly)                // Generate timestamp

// Dialog management
const dm = new DialogManager(day)           // Create dialog manager
dm.getGreetingResponse()                    // Get day's greeting  
dm.getResponse(userInput)                   // Process user input
```

This documentation provides a comprehensive technical guide to understanding and working with the KidsteamConversationAgent codebase. For beginners, start with the Project Overview and Architecture sections, then dive deeper into specific components as needed.