// util.js
// ========
const fs = require('fs');
const AWS = require('aws-sdk');
const environmentVars = require('dotenv').config();
// Enter copied or downloaded access ID and secret key here
const ID = process.env.AWSAccessKeyId;
const SECRET = process.env.AWSSecretKey;

// The name of the bucket that you have created
const BUCKET_NAME = 'caskillresponses';

const s3 = new AWS.S3({
    accessKeyId: ID,
    secretAccessKey: SECRET
});

module.exports = {
    uploadFileToS3 (fileName, key) {
        try{
            // Read content from the file
            const fileContent = fs.readFileSync(fileName);
        
            // Setting up S3 upload parameters
            const params = {
                Bucket: BUCKET_NAME,
                Key: key, // File name you want to save as in S3
                Body: fileContent
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
        }
        catch(err) {
            console.log(err)
        }
    },

    getTimeStamp () {
        let d = new Date();
        let curr_date = d.getDate();
        let curr_month = d.getMonth() + 1; //Months are zero based
        let curr_year = d.getFullYear();
        let curr_hr = d.getHours();
        let curr_min = d.getMinutes();
        let curr_sec = d.getSeconds();
        let timestamp = curr_year + "_" + curr_month + "_" + curr_date + "_"
            + curr_hr + "_" + curr_min + "_" + curr_sec;
        return timestamp
    },

    deleteDirFilesWithPrefix (prefix, dirPath) {
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
};
