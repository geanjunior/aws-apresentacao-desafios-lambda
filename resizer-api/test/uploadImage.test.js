const assert = require('chai').assert;
const sinon = require('sinon');
const AWS = require('aws-sdk-mock');
const { handler } = require('../src/uploadImage');

describe('uploadImage', () => {
  afterEach(() => {
    AWS.restore();
  });

  it('should upload image to S3 and send message to SQS', async () => {
    const bucketName = 'resizer-api-bucket';
    const queueUrl = 'https://sqs.us-east-1.amazonaws.com/637154232334/resizer-api-queue';
    const requestBody = Buffer.from('base64-encoded-image-data');
    const event = {
      body: requestBody.toString('base64'),
      queryStringParameters: { filename: 'test.jpg' }
    };

    AWS.mock('S3', 'putObject', (params) => {
      assert.equal(params.Bucket, bucketName);
      assert.equal(params.Key, 'test.jpg');
      assert.deepEqual(params.Body, requestBody);
      assert.equal(params.ContentType, 'image/jpeg');
      return { promise: () => {} };
    });

    AWS.mock('SQS', 'sendMessage', (params) => {
      assert.equal(params.QueueUrl, queueUrl);
      assert.deepEqual(JSON.parse(params.MessageBody), {
        bucketName,
        fileName: 'test.jpg'
      });
      return { promise: () => {} };
    });

    const result = await handler(event);
    assert.equal(result.statusCode, 200);
    assert.deepEqual(JSON.parse(result.body), {
      message: 'Image uploaded and message sent to SQS'
    });
  });
});
