# KidsteamConversationAgent

A conversational AI system designed for children to interact with a superhero character named "Zip" as part of a 5-day self-talk skill training program.

## 🏗️ Project Architecture

This is a **microservices architecture** with three main components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│  React WebApp   │◄──►│   Node.js Server │◄──►│ Python Sentiment    │
│  (Frontend)     │    │   (Backend)      │    │ Analysis Client     │
│  Port: 3000     │    │   Port: 1337     │    │                     │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
```

### Project Structure
```
KidsteamConversationAgent/
├── package.json              # Root package (shared dev tools: uuid, nodemon)
├── react_webapp/
│   ├── package.json          # React app (superhero-app)
│   └── src/                  # Frontend React components
├── node_server/
│   ├── package.json          # Node.js server (GoogleCloudSpeechPlayground)
│   ├── app.js               # Main server file
│   └── .env                 # Environment variables (create this)
└── classification_client/    # Python sentiment analysis service
```

## 🚀 How to Start the App Locally

### Prerequisites
- Node.js and npm installed
- Google Cloud credentials JSON file
- AWS credentials configured

### Step 1: Initial Setup

1. **Clone the repository** using GitHub Desktop or:
   ```bash
   git clone [repository-url]
   cd KidsteamConversationAgent
   ```

2. **Configure for local development:**
   
   **a) Update AudioService.js:**
   ```bash
   # Edit react_webapp/src/AudioService.js
   # Change line to: const ENDPOINT = "http://localhost:1337";
   ```
   
   **b) Update Node server for HTTP:**
   ```bash
   # Edit node_server/app.js
   # Line 11: const https = require('http')  (already configured)
   # Lines 32-34: Comment out SSL certificate lines (already done)
   ```

3. **Create .env files:**
   
   Create `.env` file in `node_server/` folder:
   ```env
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/gcloud-credentials.json
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   ```
   
   Create `.env` file in `react_webapp/` folder (if needed):
   ```env
   # Add any React environment variables here
   ```

### Step 2: Start Backend Server

```bash
# Navigate to node server directory
cd node_server

# Install dependencies
npm install

# Start the server
node app.js
# OR for development with auto-restart:
npm run dev
```

**Expected output:** Server should start on `http://localhost:1337`

### Step 3: Start Frontend (React App)

**Open a NEW terminal** and run:

```bash
# Navigate to React app directory
cd react_webapp

# Install dependencies
npm install

# Start the React development server
npm start
```

**Expected output:** React app should start on `http://localhost:3000`

### Step 4: Start Python Sentiment Analysis (Optional)

```bash
# Navigate to classification client
cd classification_client

# Install Python dependencies
pip install -r requirements.txt

# Start the sentiment analysis service
python sentiment_client.py
```

## 🔧 Package.json Breakdown

### Root `package.json`
- **Purpose:** Shared development tools
- **Dependencies:** `uuid`, `nodemon`
- **No scripts** - not meant to be run directly

### Node Server `package.json`
- **Name:** GoogleCloudSpeechPlayground
- **Main:** `app.js`
- **Scripts:**
  - `npm start` → `node app.js`
  - `npm run dev` → `nodemon app.js` (auto-restart)
- **Key Dependencies:**
  - `@google-cloud/speech` - Speech recognition
  - `@google-cloud/text-to-speech` - Voice synthesis
  - `aws-sdk` - Cloud storage
  - `express` - Web server
  - `socket.io` - Real-time communication

### React App `package.json`
- **Name:** superhero-app
- **Scripts:**
  - `npm start` → `react-scripts start`
  - `npm run build` → `react-scripts build`
- **Key Dependencies:**
  - `react` - Frontend framework
  - `socket.io-client` - Real-time communication
  - `react-router-dom` - Navigation

## 🚨 Common Issues & Solutions

### Issue: "Missing script: start"
**Cause:** Running npm commands from wrong directory
**Solution:** Make sure you're in the correct folder:
- For React: `cd react_webapp` then `npm start`
- For Server: `cd node_server` then `node app.js`

### Issue: React app won't start
**Solution:**
```bash
cd react_webapp
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Server connection errors
**Solution:** 
- Check if server is running on port 1337
- Verify AudioService.js points to `http://localhost:1337`
- Check .env file configuration

## 📁 Important Files

- `react_webapp/src/AudioService.js` - Frontend-backend communication
- `node_server/app.js` - Main server application
- `node_server/.env` - Server environment variables
- Various CSV files - Conversation scripts and data

## 🎯 Usage

1. Open browser to `http://localhost:3000`
2. Interact with the superhero character "Zip"
3. Follow the 5-day conversation program
4. Audio is processed in real-time via Google Cloud APIs

---

**Note:** Always start the Node.js server BEFORE the React app to ensure proper communication between frontend and backend.
