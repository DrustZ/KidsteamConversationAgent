// util.js
// ========
const fs = require('fs');
const AWS = require('aws-sdk');
const environmentVars = require('dotenv').config();
// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWSAccessKeyId;
const SECRET = process.env.AWSSecretKey;

// The name of the bucket that you have created
const BUCKET_NAME = 'kidsrecording';
const DDBTABLENAME = 'kidscaskill'

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});


const dynamoDB = new AWS.DynamoDB.DocumentClient({
    accessKeyId: ID,
    secretAccessKey: SECRET,
    region: "us-west-2", 
})

async function finishConversation(user_id, day) {
    try {
        let data = await dynamoDB.get({
                    TableName: DDBTABLENAME,
                    Key: {
                        uid: user_id,
                    }}).promise()
        let today = getTimeStamp()
        let new_record = `${day}:${today}`
        if (data.Item !== undefined) {
            new_record = `${data.Item.user_history};${new_record}`
        }
        await dynamoDB.update({
            TableName: DDBTABLENAME,
            Key: {
                uid: user_id,
            },
            UpdateExpression: `set user_history = :user_history`,
            ExpressionAttributeValues: {
            ":user_history": new_record,
            },
        }).promise()
    } catch (e) { 
        console.log(e) 
    }
}


function getLastRecord( record ){
    // record: dayn:date; {example: 1:2022_07_01;}
    let days = record.split(';')
    return days[days.length-1].split(':')
}

// callback needs two param: dayN, sameday
function getDayOfUser(user_id, callback) {
    dynamoDB
    .get({
        TableName: DDBTABLENAME,
        Key: {
            uid: user_id,
        },
    })
    .promise()
    .then( (data) => {
            if (data.Item !== undefined) {
                let lastrecord = getLastRecord(data.Item.user_history)
                let lastday = Number(lastrecord[0])
                let lastdate = lastrecord[1].split('-')[0] //only get date without hour
                let today = getTimeStamp(onlydate=true)
                console.log(lastdate, today, lastday)
                if (today === lastdate) {
                    callback(lastday, true) //same day
                } else {
                    callback(lastday+1, false)
                }
            }
            else {
                callback(1, false)
            }
        }
    )
    .catch(console.error)
}

function uploadFileToS3NDelete(fileName, key) {
    try{
        // Read content from the file
        fs.readFile(fileName, (err, content) => {
            if (err) {
                console.log(err)
                throw(err)
            }
            // Setting up S3 upload parameters
            const params = {
                Bucket: BUCKET_NAME,
                Key: key, // File name you want to save as in S3
                Body: content
            };
        
            // Uploading files to the bucket
            s3.upload(params, function(err, data) {
                if (err) {
                    throw err;
                }
                console.log(`File uploaded successfully. ${data.Location}`);
                fs.unlink(fileName,function(err){
                    if(err) return console.log(err);
                    console.log('file deleted successfully');
                });
            });
        });
    }
    catch(err) {
        console.log(err)
    }
}

function getTimeStamp(onlydate=false) {
    let d = new Date();
    let curr_date = d.getDate();
    let curr_month = d.getMonth() + 1; //Months are zero based
    let curr_year = d.getFullYear();
    let curr_hr = d.getHours();
    let curr_min = d.getMinutes();
    let curr_sec = d.getSeconds();
    if (onlydate) {
        return curr_year + "_" + curr_month + "_" + curr_date
    }
    let timestamp = curr_year + "_" + curr_month + "_" + curr_date + "-"
        + curr_hr + "_" + curr_min + "_" + curr_sec;
    return timestamp
}

function deleteDirFilesWithPrefix(prefix, dirPath) {
    // default directory is the current directory
  
    // get all file names in directory
    fs.readdir(dirPath, (err, fileNames) => {
      if (err) throw err;
  
      // iterate through the found file names
      for (const name of fileNames) {
        // if file name matches the pattern
        if (name.startsWith(prefix)) {
          // try to remove the file and log the result
          fs.unlink(dirPath+name, (err) => {
            if (err) console.log(err);
          });
        }
      }
    });
}

module.exports = {
    getDayOfUser,
    finishConversation,
    uploadFileToS3NDelete,
    getTimeStamp,
    deleteDirFilesWithPrefix,
}


