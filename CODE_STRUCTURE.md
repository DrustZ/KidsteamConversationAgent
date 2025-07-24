# KidsteamConversationAgent - Code Structure Analysis

## Project Overview

This is a **Conversational Agent System** designed for children to interact with a superhero character named "Zip" as part of a 5-day self-talk skill training program. The system is built as a multi-component application with a Node.js backend, React frontend, and Python-based sentiment analysis service.

### Project Purpose
- Educational tool for children's conversation skill development
- Interactive storytelling with a superhero character "Zip"
- Multi-day structured conversation sessions
- Real-time speech recognition and text-to-speech capabilities
- User progress tracking and conversation logging

## Architecture Overview

The project follows a **microservices architecture** with three main components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  React WebApp   │◄──►│   Node.js Server │◄──►│ Python Sentiment    │
│  (Frontend)     │    │   (Backend)      │    │ Analysis Client     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         │                       │                         │
         │                       │                         │
         ▼                       ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  Browser APIs   │    │  Google Cloud    │    │  Hugging Face       │
│  - WebRTC       │    │  - Speech-to-Text│    │  DistilBERT Model   │
│  - WebAudio     │    │  - Text-to-Speech│    │                     │
│  - Socket.IO    │    │  - AWS S3/DynamoDB│   │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

## Directory Structure Analysis

### Root Level
```
KidsteamConversationAgent/
├── package.json              # Main project dependencies (uuid, nodemon)
├── README.md                 # Basic project description
├── classification_client/    # Python sentiment analysis service
├── node_server/             # Node.js backend server
└── react_webapp/           # React frontend application
```

## Component Deep Dive

### 1. Node.js Server (`node_server/`)

**Purpose**: Central backend server handling WebSocket connections, speech processing, conversation management, and cloud services integration.

#### Key Files:
- **`app.js` (314 lines)**: Main server application
  - Express.js HTTP server with Socket.IO WebSocket support
  - Google Cloud Speech-to-Text and Text-to-Speech integration
  - Real-time audio streaming and processing
  - User session management and conversation logging
  - AWS S3 file upload and DynamoDB user tracking

- **`conversation.js` (137 lines)**: Dialog Management System
  - CSV-based conversation script engine
  - State machine for conversation flow
  - Keyword matching for user response processing
  - Multi-day conversation support (5 days max)

- **`util.js` (203 lines)**: Utility Functions
  - AWS S3 file upload functionality
  - DynamoDB user progress tracking
  - File management and cleanup operations
  - Timestamp generation and date handling

#### Key Features:
- **Real-time Speech Processing**: Streams audio to Google Cloud Speech API
- **Conversation State Management**: Tracks user progress through scripted conversations
- **Cloud Storage**: Uploads audio recordings and transcripts to AWS S3
- **User Session Tracking**: Maintains conversation history in DynamoDB
- **Multi-day Support**: Handles 5-day conversation program

#### Dependencies:
```json
{
  "@google-cloud/speech": "^4.2.0",
  "@google-cloud/text-to-speech": "^3.4.0",
  "aws-sdk": "^2.1140.0",
  "csv-parse": "^5.0.4",
  "express": "^4.18.1",
  "socket.io": "^3.1.1"
}
```

#### Data Files:
- **`conversation_script.csv`**: Main conversation flow definitions (256 lines)
- **`response.csv`**: Keyword mappings for user response processing
- **`conversation_script_test.csv`**: Testing conversation scripts
- **Archive files**: Historical conversation data

### 2. React WebApp (`react_webapp/`)

**Purpose**: Interactive frontend providing the user interface for children to interact with the superhero conversation agent.

#### Project Structure:
```
react_webapp/
├── package.json           # React app dependencies
├── public/               # Static assets
│   ├── index.html       # Main HTML template
│   ├── audio/           # Audio files (ding.mp3, silence.mp3)
│   └── img/             # Images (superhero, profiles, diamonds, mic icons)
└── src/                 # React source code
    ├── App.js          # Main application component (295 lines)
    ├── AudioService.js # Audio/Socket management (169 lines)
    ├── index.js        # React app entry point
    ├── index.css       # Global styles
    ├── components/     # Reusable UI components
    │   ├── Avatar.js   # Character avatar display
    │   ├── DiamondList.js # Progress tracking UI
    │   ├── GoogleLogin.js # Authentication component
    │   └── Mic.js      # Microphone interface
    └── pages/          # Main application pages
        ├── OnboardingPage.js  # User login/start page
        ├── ReminderPage.js    # Daily session reminders
        ├── PromptPage.js      # Conversation prompts
        ├── InteractionPage.js # Main conversation interface
        └── FinishPage.js      # Session completion page
```

#### Key Components:

**`App.js` (295 lines)**: Main Application Controller
- State management for conversation flow
- WebSocket communication with backend
- Audio recording and playback coordination
- Page navigation and user session handling
- Timer management for conversation silences

**`AudioService.js` (169 lines)**: Audio Processing Service
- Socket.IO client configuration
- Microphone recording using WebRTC
- Audio playback from S3-hosted files
- Real-time audio streaming to backend

#### User Interface Flow:
1. **Onboarding**: Google Login and user identification
2. **Reminder**: Daily session introduction
3. **Prompt**: Conversation setup and instructions
4. **Interaction**: Main conversation interface with superhero
5. **Finish**: Session completion and progress summary

#### Dependencies:
```json
{
  "react": "^18.1.0",
  "react-router-dom": "^6.3.0",
  "socket.io-client": "^4.5.1",
  "gapi-script": "^1.2.0",
  "react-usestateref": "^1.0.8"
}
```

### 3. Classification Client (`classification_client/`)

**Purpose**: Python-based sentiment analysis service using machine learning models.

#### Files:
- **`sentiment_cls.py`**: Sentiment Analysis Service
  - Uses Hugging Face DistilBERT model for sentiment classification
  - Socket.IO client connecting to Node.js server
  - Real-time sentiment analysis of user responses

- **`sentiment_testing.ipynb`**: Jupyter notebook for model testing and development

#### Key Features:
- **Model**: DistilBERT-base-uncased fine-tuned for sentiment analysis
- **Real-time Processing**: Analyzes user speech sentiment during conversations
- **Integration**: Connects via Socket.IO to main server

## Data Flow Architecture

### 1. User Authentication Flow
```
React App → Google OAuth → Node.js Server → DynamoDB (User lookup) → Session Initialization
```

### 2. Conversation Flow
```
User Speech → WebRTC → React App → Socket.IO → Node.js Server → Google Cloud STT → 
Conversation Engine → Response Generation → Google Cloud TTS → Audio File → 
S3 Storage → React App → Audio Playback
```

### 3. Data Persistence Flow
```
Audio Stream → WAV File → S3 Upload
Conversation Transcript → Text File → S3 Upload
User Progress → DynamoDB Update
```

## Key Technologies and Integrations

### Cloud Services:
- **Google Cloud Speech-to-Text**: Real-time speech recognition
- **Google Cloud Text-to-Speech**: AI-generated voice responses
- **AWS S3**: Audio and transcript file storage
- **AWS DynamoDB**: User progress and session tracking

### Communication:
- **Socket.IO**: Real-time bidirectional communication
- **WebRTC**: Browser-based audio recording
- **HTTP/HTTPS**: REST API communication

### AI/ML:
- **Hugging Face Transformers**: Sentiment analysis
- **DistilBERT**: Pre-trained language model
- **Custom Conversation Engine**: Rule-based dialog management

## Configuration and Environment

### Environment Variables (Node.js):
- `AWSAccessKeyId`: AWS credentials
- `AWSSecretKey`: AWS credentials
- `PORT`: Server port (default: 1337)

### External Dependencies:
- Google Cloud credentials for Speech APIs
- AWS credentials for S3 and DynamoDB access
- Socket.IO real-time communication

## Development and Deployment

### Development Setup:
1. **Node.js Server**: `npm run dev` (uses nodemon)
2. **React App**: `npm start` (development server)
3. **Python Service**: Direct Python execution

### Production Considerations:
- HTTPS configuration (SSL certificates commented out)
- Environment-specific endpoints
- Cloud service authentication
- Audio file cleanup and storage management

## Data Models

### User Session Data:
```javascript
{
  uid: "user_email",
  user_history: "day:timestamp;day:timestamp...",
  // Stored in DynamoDB
}
```

### Conversation State:
```javascript
{
  day: 1-5,           // Current day of 5-day program
  status: "greeting", // Current conversation state
  responses: [],      // Generated responses
  // Managed in memory
}
```

## Summary

This is a sophisticated **educational conversational AI system** designed for children, featuring:

- **Multi-modal interaction** (speech, visual, text)
- **Structured learning program** (5-day curriculum)
- **Real-time AI processing** (speech recognition, sentiment analysis)
- **Cloud-based architecture** (scalable and persistent)
- **Child-friendly interface** (superhero theme, visual feedback)

The system demonstrates modern web development practices, AI integration, and educational technology design, making it suitable for both research and practical deployment in educational settings.
