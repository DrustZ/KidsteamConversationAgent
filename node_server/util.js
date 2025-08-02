"use strict";

/**
 * KidsteamConversationAgent - Utility Functions
 * 
 * This module provides essential utility functions for the conversation agent system,
 * supporting the core functionality of the 5-day self-talk skill training program.
 * It handles cloud storage, user progress tracking, file management, and system utilities.
 * 
 * Educational Technology Purpose:
 * - Enables persistent storage of children's conversation recordings for analysis
 * - Tracks user progress through the 5-day educational program
 * - Manages temporary files and system resources efficiently
 * - Provides reliable cloud backup of educational data
 * 
 * Key Features:
 * - AWS S3 file upload and management for audio recordings and transcripts
 * - AWS DynamoDB user progress tracking and session management
 * - Local file cleanup operations to prevent disk space issues
 * - Timestamp and date handling utilities for consistent file naming
 * - User session management and day progression logic
 * - Error handling and logging for production reliability
 * 
 * Cloud Architecture:
 * - S3 Bucket: Stores audio recordings and conversation transcripts
 * - DynamoDB Table: Tracks user progress, login history, and conversation completion
 * - Local Storage: Temporary file processing before cloud upload
 * - Automated Cleanup: Prevents local storage accumulation
 * 
 * Data Privacy & Security:
 * - User identification through Google OAuth email addresses
 * - Secure cloud storage with AWS IAM permissions
 * - Automatic local file deletion after cloud upload
 * - Timestamped file naming for organized data management
 * 
 * Created by Vinzenz Aubry for sansho 24.01.17
 * Contact: v@vinzenzaubry.com
 */

// ========================== DEPENDENCIES ========================== //

const fs = require("fs");             // File system operations for local file management
const AWS = require("aws-sdk");       // AWS SDK for S3 and DynamoDB operations
const environmentVars = require("dotenv").config(); // Environment variable configuration

// ========================== AWS CONFIGURATION ========================== //

/**
 * AWS Credentials and Configuration
 * 
 * Security Note: In production, use IAM roles or environment variables
 * instead of hardcoded credentials for enhanced security.
 */
const ID = process.env.AWSAccessKeyId;      // AWS Access Key ID from environment
const SECRET = process.env.AWSSecretKey;    // AWS Secret Access Key from environment

// Cloud storage configuration
const BUCKET_NAME = "kidsrecording";        // S3 bucket for storing audio files and transcripts
const DDBTABLENAME = "kidscaskill";         // DynamoDB table for user progress tracking

// ========================== AWS SERVICE CLIENTS ========================== //

/**
 * AWS S3 Client Configuration
 * 
 * S3 is used for storing:
 * - Audio recordings from user conversations (WAV files)
 * - Conversation transcripts (TXT files)
 * - Any other educational content files
 */
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
  region: "us-west-2",              // Ensure this matches your bucket region
});

/**
 * AWS DynamoDB Client Configuration
 * 
 * DynamoDB is used for storing:
 * - User progress through the 5-day program
 * - Session completion timestamps
 * - User login history and engagement metrics
 * - Day progression and completion status
 */
const dynamoDB = new AWS.DynamoDB.DocumentClient({
  accessKeyId: ID,
  secretAccessKey: SECRET,
  region: "us-west-2",              // Ensure this matches your table region
});

// ========================== USER PROGRESS TRACKING ========================== //

/**
 * Record conversation completion in DynamoDB
 * 
 * This function updates the user's progress history when they complete
 * a conversation session. It maintains a chronological record of all
 * completed sessions for progress tracking and analytics.
 * 
 * @param {string} user_id - User's unique identifier (email from Google OAuth)
 * @param {number} day - Day number in the 5-day program (1-5)
 * 
 * Database Schema:
 * - uid: User identifier (primary key)
 * - user_history: Semicolon-separated list of "day:timestamp" entries
 *   Example: "1:2022_07_01-14_30_25;2:2022_07_02-15_45_10"
 */

 */
async function finishConversation(user_id, day) {
  try {
    console.log(`Recording conversation completion for user ${user_id}, day ${day}`);
    
    // ========================== RETRIEVE EXISTING USER DATA ========================== //
    
    // Get current user record from DynamoDB
    let data = await dynamoDB
      .get({
        TableName: DDBTABLENAME,
        Key: {
          uid: user_id,         // Primary key: user identifier
        },
      })
      .promise();

    // ========================== CREATE NEW HISTORY ENTRY ========================== //
    
    // Generate timestamp for this completion
    let today = getTimeStamp();
    let new_record = `${day}:${today}`;
    
    // If user has existing history, append to it; otherwise start fresh
    if (data.Item !== undefined && data.Item.user_history) {
      new_record = `${data.Item.user_history};${new_record}`;
    }
    
    console.log(`Updating user history: ${new_record}`);

    // ========================== UPDATE USER RECORD ========================== //
    
    // Update or create user record with new completion entry
    await dynamoDB
      .update({
        TableName: DDBTABLENAME,
        Key: {
          uid: user_id,
        },
        UpdateExpression: `set user_history = :user_history`,
        ExpressionAttributeValues: {
          ":user_history": new_record,
        },
      })
      .promise();
      
    console.log(`Successfully recorded completion for user ${user_id}, day ${day}`);
    
  } catch (e) {
    console.error("Error recording conversation completion:", e);
    // Don't throw error to avoid breaking conversation flow
  }
}

// ========================== HELPER FUNCTIONS ========================== //

/**
 * Parse the last record from user history string
 * 
 * @param {string} record - User history string (format: "day:date;day:date;...")
 * @returns {Array<string>} [day, timestamp] - Last completion day and timestamp
 * 
 * Example input: "1:2022_07_01-14_30_25;2:2022_07_02-15_45_10"
 * Example output: ["2", "2022_07_02-15_45_10"]
 */
function getLastRecord(record) {
  let days = record.split(";");                    // Split by semicolon
  return days[days.length - 1].split(":");        // Get last entry and split by colon
}

// ========================== USER DAY DETERMINATION ========================== //

/**
 * Determine which day the user should be on in the 5-day program
 * 
 * This function implements the core logic for day progression:
 * - New users start on Day 1
 * - Users continue from their last completed day + 1
 * - If same day as last completion, they can repeat the same day
 * - Maximum 5 days in the program
 * 
 * @param {string} user_id - User's unique identifier (email)
 * @param {Function} callback - Callback function with signature (dayNumber, sameDay)
 *   - dayNumber: Which day the user should be on (1-5)
 *   - sameDay: Boolean indicating if this is the same calendar day as last session
 */
 */
function getDayOfUser(user_id, callback) {
  console.log(`Determining day for user: ${user_id}`);
  
  dynamoDB
    .get({
      TableName: DDBTABLENAME,
      Key: {
        uid: user_id,
      },
    })
    .promise()
    .then((data) => {
      console.log("DynamoDB user data:", data);
      
      // ========================== SPECIAL TEST USER HANDLING ========================== //
      
      // Special handling for test user - allows testing all days
      if (user_id == "test") {
        console.log("Test user detected, returning day 9 for testing");
        callback(9, false);
        return;
      }

      // ========================== EXISTING USER LOGIC ========================== //
      
      if (data.Item !== undefined && data.Item.user_history) {
        // User has existing history - determine next day
        let lastrecord = getLastRecord(data.Item.user_history);
        let lastday = Number(lastrecord[0]);              // Last completed day
        let lastdate = lastrecord[1].split("-")[0];       // Last completion date (YYYY_MM_DD)
        let today = getTimeStamp(true);                   // Today's date (YYYY_MM_DD)

        console.log(`Last completion: Day ${lastday} on ${lastdate}`);
        console.log(`Today: ${today}`);

        // ========================== DAY PROGRESSION LOGIC ========================== //
        
        if (today === lastdate) {
          // Same calendar day as last completion
          console.log("Same day as last completion - allowing repeat");
          callback(lastday, true);        // Allow repeating same day
        } else {
          // Different calendar day - advance to next day
          let nextDay = Math.min(lastday + 1, 5);  // Cap at day 5
          console.log(`Different day - advancing to Day ${nextDay}`);
          callback(nextDay, false);
        }
        
      } else {
        // ========================== NEW USER LOGIC ========================== //
        
        // No existing history - start with Day 1
        console.log("New user detected - starting with Day 1");
        callback(1, false);
      }
    })
    .catch((error) => {
      console.error("Error fetching user data from DynamoDB:", error);
      // Fallback to Day 1 for new users if database error occurs
      callback(1, false);
    });
}

// ========================== AWS S3 FILE OPERATIONS ========================== //

/**
 * Upload file to AWS S3 and delete local copy
 * 
 * This function handles the workflow of uploading educational content to cloud storage
 * and cleaning up local temporary files to prevent disk space accumulation.
 * 
 * Use Cases:
 * - Audio recordings from user conversations
 * - Conversation transcripts and logs
 * - Any other educational content files
 * 
 * @param {string} fileName - Local file path to upload
 * @param {string} key - S3 object key (filename in the bucket)
 * 
 * Process Flow:
 * 1. Read file content from local storage
 * 2. Upload to S3 bucket with specified key
 * 3. Delete local file upon successful upload
 * 4. Log results for monitoring and debugging
 */
function uploadFileToS3NDelete(fileName, key) {
  try {
    console.log(`Starting S3 upload: ${fileName} -> ${key}`);
    
    // ========================== FILE READING ========================== //
    
    // Read content from the local file
    fs.readFile(fileName, (err, content) => {
      if (err) {
        console.error(`Error reading file ${fileName}:`, err);
        return;
      }
      
      console.log(`File read successfully, size: ${content.length} bytes`);

      // ========================== S3 UPLOAD CONFIGURATION ========================== //
      
      // Setting up S3 upload parameters
      const params = {
        Bucket: BUCKET_NAME,      // Target S3 bucket
        Key: key,                 // File name in S3 (can include folder structure)
        Body: content,            // File content buffer
        ContentType: getContentType(key),  // Automatic content type detection
      };

      // ========================== S3 UPLOAD EXECUTION ========================== //
      
      // Upload file to S3 bucket
      s3.upload(params, function (err, data) {
        if (err) {
          console.error(`S3 upload failed for ${key}:`, err);
          return;
        }
        
        console.log(`File uploaded successfully to S3: ${data.Location}`);

        // ========================== LOCAL FILE CLEANUP ========================== //
        
        // Delete local file after successful upload to free disk space
        fs.unlink(fileName, function (err) {
          if (err) {
            console.error(`Error deleting local file ${fileName}:`, err);
            return;
          }
          console.log(`Local file deleted successfully: ${fileName}`);
        });
      });
    });
    
  } catch (err) {
    console.error("Error in uploadFileToS3NDelete:", err);
  }
}

/**
 * Helper function to determine content type based on file extension
 * 
 * @param {string} filename - File name or path
 * @returns {string} MIME content type
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const contentTypes = {
    'wav': 'audio/wav',
    'mp3': 'audio/mpeg',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// ========================== TIMESTAMP UTILITIES ========================== //

/**
 * Generate timestamp string for file naming and record keeping
 * 
 * This utility creates consistent timestamp formats used throughout the system
 * for file naming, database records, and logging purposes.
 * 
 * @param {boolean} onlydate - If true, returns only date (YYYY_MM_DD)
 *                             If false, returns full timestamp (YYYY_MM_DD-HH_MM_SS)
 * @returns {string} Formatted timestamp string
 * 
 * Format Examples:
 * - Date only: "2022_07_15"
 * - Full timestamp: "2022_07_15-14_30_25"
 * 
 * Use Cases:
 * - File naming: "user123-day2-2022_07_15-14_30_25.wav"
 * - Database records: "2:2022_07_15-14_30_25"
 * - Log timestamps and session tracking
 */
function getTimeStamp(onlydate = false) {
  let d = new Date();
  
  // Extract date components
  let curr_date = d.getDate();          // Day of month (1-31)
  let curr_month = d.getMonth() + 1;    // Month (1-12, note: getMonth() is 0-based)
  let curr_year = d.getFullYear();      // Full year (e.g., 2022)
  
  // Extract time components
  let curr_hr = d.getHours();           // Hour (0-23)
  let curr_min = d.getMinutes();        // Minutes (0-59)
  let curr_sec = d.getSeconds();        // Seconds (0-59)
  
  // Pad numbers with leading zeros for consistent formatting
  const pad = (num) => num.toString().padStart(2, '0');
  
  // Return date-only format if requested
  if (onlydate) {
    return `${curr_year}_${pad(curr_month)}_${pad(curr_date)}`;
  }
  
  // Return full timestamp format
  let timestamp = `${curr_year}_${pad(curr_month)}_${pad(curr_date)}-${pad(curr_hr)}_${pad(curr_min)}_${pad(curr_sec)}`;
  return timestamp;
}

// ========================== FILE MANAGEMENT UTILITIES ========================== //

/**
 * Delete files with specific prefix from directory
 * 
 * This function performs cleanup operations to remove temporary files
 * when users start new sessions, preventing accumulation of cached files
 * and ensuring clean state for each conversation session.
 * 
 * @param {string} prefix - File prefix to match (e.g., user email or session ID)
 * @param {string} dirPath - Directory path to search for files
 * 
 * Use Cases:
 * - Clean up cached audio recordings when user logs in
 * - Remove temporary transcription files from previous sessions
 * - General file maintenance and disk space management
 * 
 * Security Note: Only deletes files with matching prefix to prevent
 * accidental deletion of unrelated files.
 * 
 * Example Usage:
 * deleteDirFilesWithPrefix("user123@email.com", "./recordings/")
 * This would delete files like:
 * - user123@email.com-day1-recording.wav
 * - user123@email.com-day2-transcript.txt
 */
function deleteDirFilesWithPrefix(prefix, dirPath) {
  console.log(`Cleaning up files with prefix "${prefix}" in directory: ${dirPath}`);
  
  // ========================== DIRECTORY READING ========================== //
  
  // Get all file names in the specified directory
  fs.readdir(dirPath, (err, fileNames) => {
    if (err) {
      console.error(`Error reading directory ${dirPath}:`, err);
      return;
    }

    console.log(`Found ${fileNames.length} files in directory`);
    let deletedCount = 0;

    // ========================== FILE FILTERING AND DELETION ========================== //
    
    // Iterate through all files in the directory
    for (const name of fileNames) {
      // Check if file name matches the specified prefix
      if (name.startsWith(prefix)) {
        console.log(`Deleting file: ${name}`);
        
        // Attempt to remove the matching file
        fs.unlink(dirPath + name, (err) => {
          if (err) {
            console.error(`Error deleting file ${name}:`, err);
            return;
          }
          deletedCount++;
          console.log(`Successfully deleted: ${name}`);
        });
      }
    }
    
    // Log cleanup summary
    setTimeout(() => {
      console.log(`Cleanup completed. Deleted ${deletedCount} files with prefix "${prefix}"`);
    }, 100); // Small delay to allow async deletions to complete
  });
}

// ========================== MODULE EXPORTS ========================== //

/**
 * Export utility functions for use throughout the application
 * 
 * These functions support the core educational technology infrastructure:
 * - User progress tracking through DynamoDB
 * - File storage and management via S3
 * - Session management and cleanup operations
 * - Timestamp utilities for consistent record keeping
 */
module.exports = {
  getDayOfUser,              // Determine user's current day in 5-day program
  finishConversation,        // Record conversation completion in database
  uploadFileToS3NDelete,     // Upload files to cloud storage and cleanup local copies
  getTimeStamp,              // Generate consistent timestamp strings
  deleteDirFilesWithPrefix,  // Clean up temporary files by prefix matching
};

/**
 * ========================== USAGE EXAMPLES ========================== //
 * 
 * // Determine user's current day
 * utils.getDayOfUser("user@email.com", (day, sameDay) => {
 *   console.log(`User should be on day ${day}, same day: ${sameDay}`);
 * });
 * 
 * // Record conversation completion
 * utils.finishConversation("user@email.com", 3);
 * 
 * // Upload file to S3 and delete local copy
 * utils.uploadFileToS3NDelete("./recordings/audio.wav", "user-audio.wav");
 * 
 * // Generate timestamp
 * const timestamp = utils.getTimeStamp(); // "2022_07_15-14_30_25"
 * const dateOnly = utils.getTimeStamp(true); // "2022_07_15"
 * 
 * // Clean up user files
 * utils.deleteDirFilesWithPrefix("user@email.com", "./recordings/");
 */
