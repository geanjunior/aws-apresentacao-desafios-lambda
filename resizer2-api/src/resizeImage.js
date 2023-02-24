'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');

module.exports.handler = async (event, context) => {
  const record = event.Records[0];
  const messageBody = JSON.parse(record.body);
  const bucketName = messageBody.bucketName;
  const fileName = messageBody.fileName;
  const resizedFileName = `resized-${fileName}`;

  try {
    const s3Params = {
      Bucket: bucketName,
      Key: fileName
    };
    const imageBuffer = await s3.getObject(s3Params).promise();
    const resizedImageBuffer = await sharp(imageBuffer.Body).resize(200, 200).toBuffer();
    const resizedS3Params = {
      Bucket: bucketName,
      Key: resizedFileName,
      Body: resizedImageBuffer,
      ContentType: 'image/jpeg'
    };
    await s3.putObject(resizedS3Params).promise();
    console.log(`Resized image ${fileName} saved as ${resizedFileName}`);

    return;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to resize image ${fileName}`);
  }
};