# Learning Knowledge Log - KidsteamConversationAgent

This document tracks technical knowledge and concepts learned while working on this conversational AI project.

## Format Template

## [Date] - [Topic/Category]
- Knowledge point 1: Specific technical learning
- Knowledge point 2: Framework/library insight
- Knowledge point 3: Architecture or design pattern
- Knowledge point 4: ...
- **Code Example** (if applicable):
  ```javascript
  // Example code snippet
  ```



## July 24, 2025 - Project Architecture Analysis

- **Microservices Communication**: Real-time bidirectional communication using Socket.IO enables seamless coordination between React frontend, Node.js backend, and Python sentiment analysis service
- **WebRTC Audio Streaming**: Browser WebRTC APIs can stream real-time audio directly to server-side speech recognition services without file uploads
- **Conversation State Management**: CSV-based conversation scripts with keyword matching provide flexible dialog management without complex NLP frameworks
- **Cloud Service Integration**: 
  - Google Cloud Speech-to-Text for real-time transcription
  - Google Cloud Text-to-Speech for AI voice generation
  - AWS S3 for audio file storage
  - AWS DynamoDB for user session tracking
- **Educational AI Design**: Multi-day structured conversation programs require careful state persistence and progress tracking across sessions

## July 24, 2025 - Monorepo Structure & Package Management

- **Multi-Package.json Architecture**: Each component (root, react_webapp, node_server) has its own package.json serving different purposes:
  - Root: Shared dev tools and orchestration scripts
  - React: Frontend dependencies and build tools
  - Node.js: Backend dependencies and server scripts
- **NPM Script Execution Context**: npm commands execute in the current working directory and look for package.json in that folder only
- **Directory Navigation Requirement**: Must `cd` into specific component folders because each has independent dependency trees and scripts
- **Monorepo Orchestration**: Using `concurrently` package to run multiple npm scripts simultaneously for better development workflow
- **Dependency Management Patterns**:
  - Production deps: Libraries needed at runtime (uuid, express, react)
  - Dev deps: Development tools only (nodemon, concurrently)
  - Shared deps: Utilities used across multiple components (uuid in root)
- **Version Syntax**: `^8.3.2` means "compatible version 8.3.2 or higher" (allows patch and minor updates, not major)
- **Package.json Enhancement**: Converting minimal config to full monorepo management with install, start, build, and cleanup scripts
- **Common npm Issues**: "Missing script" errors occur when running commands from wrong directory or when package.json lacks required scripts section

**Code Example - Enhanced Root Package.json**:
```json
{
  "scripts": {
    "install-all": "npm install && cd react_webapp && npm install && cd ../node_server && npm install",
    "start": "concurrently \"npm run start:server\" \"npm run start:client\"",
    "start:server": "cd node_server && npm run dev",
    "start:client": "cd react_webapp && npm start"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

## July 24, 2025 - Package.json Deep Dive & Server Startup

- **Package.json Structure Understanding**: Each package.json serves a specific role in the microservices architecture:
  - **Root package.json**: Orchestration hub with shared utilities and monorepo management scripts
  - **React package.json**: Frontend-specific dependencies and build tools (react-scripts, react-dom, socket.io-client)
  - **Node.js package.json**: Backend API dependencies and server utilities (express, @google-cloud/speech, aws-sdk)
- **Dependency Types Explained**:
  - `dependencies`: Runtime libraries shipped to production (express, react, uuid)
  - `devDependencies`: Development-only tools not included in production builds (nodemon, concurrently, react-scripts)
  - Version ranges: `^8.3.2` = compatible updates (8.3.3, 8.4.0 allowed, 9.0.0 blocked)
- **Script Execution Context**: npm always looks for package.json in current working directory - this is why `cd` is required
- **Server Startup Sequence**: Multi-component applications require specific startup order and directory navigation:
  1. Backend server must start first (provides API endpoints)
  2. Frontend React app starts second (consumes backend APIs)
  3. Python services start last (additional processing services)

**Server Startup Commands**:
```bash
# Method 1: Manual startup (old way)
cd node_server && npm install && node app.js &
cd react_webapp && npm install && npm start

# Method 2: Enhanced workflow (new way)
npm run install-all  # Install all dependencies
npm start            # Start both services simultaneously

# Method 3: Individual component control
npm run start:server # Backend only
npm run start:client # Frontend only
```

**Package.json Enhancement Pattern**:
```json
{
  "name": "project-name",
  "private": true,
  "scripts": {
    "install-all": "npm install && cd component1 && npm install && cd ../component2 && npm install",
    "start": "concurrently \"npm run start:component1\" \"npm run start:component2\"",
    "start:component1": "cd component1 && npm start",
    "start:component2": "cd component2 && npm start",
    "clean": "rm -rf node_modules */node_modules"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

- **Troubleshooting npm Script Issues**: "Missing script" errors indicate either wrong directory or missing scripts section in package.json
- **Best Practice**: Always verify current directory with `pwd` before running npm commands in multi-package projects

## Template for Future Entries

## [Date] - [Technology/Concept]
- **[Specific Learning Area]**: Brief explanation
- **[Framework/Tool Name]**: How it's used in the project
- **[Architecture Pattern]**: Design decision and reasoning
- **Code Pattern** (if applicable):
  ```javascript
  // Relevant code example
  ```
- **Best Practices**: Key takeaways for future projects
