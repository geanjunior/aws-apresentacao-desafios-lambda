'use strict';

const AWS = require('aws-sdk');
AWS.config.update({ region:'us-east-1' });
const s3 = new AWS.S3();
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

module.exports.handler = async (event, context) => {
  const bucketName = 'resizer-api-bucket';
  const queueUrl = 'https://sqs.us-east-1.amazonaws.com/637154232334/resizer-api-queue';

  try {
    console.log(event)
    const requestBody = Buffer.from(event.body, 'binary');
    const fileName = (event.queryStringParameters && event.queryStringParameters.filename) || 'image.jpg';
    const s3Params = {
      Bucket: bucketName,
      Key: fileName,
      Body: requestBody,
      ContentType: 'image/jpeg'
    };
    await s3.putObject(s3Params).promise();

    const messageParams = {
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        bucketName,
        fileName
      })
    };
    await sqs.sendMessage(messageParams).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Image uploaded and message sent to SQS' })
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to upload image and send message to SQS' })
    };
  }
};