const assert = require('chai').assert;
const sinon = require('sinon');
const AWS = require('aws-sdk-mock');
const sharp = require('sharp')
const { handler } = require('../src/resizeImage');

describe('resizeImage', () => {
  afterEach(() => {
    AWS.restore();
  });

  it('should resize image and save to S3', async () => {
    const bucketName = 'resizer2-api-bucket';
    const fileName = 'test.jpg';
    const resizedFileName = `resized-${fileName}`;
    const imageBuffer = Buffer.from('base64-encoded-image-data');
    const resizedImageBuffer = Buffer.from('resized-image-data');
   
    AWS.mock('S3', 'getObject', (params) => {
      assert.equal(params.Bucket, bucketName);
      assert.equal(params.Key, fileName);
      return { promise: () => ({ Body: imageBuffer }) };
    });
    
    AWS.mock('S3', 'putObject', (params) => {
      assert.equal(params.Bucket, bucketName);
      assert.equal(params.Key, resizedFileName);
      assert.deepEqual(params.Body, resizedImageBuffer);
      assert.equal(params.ContentType, 'image/jpeg');
      return { promise: () => {} };
    });
    
    sinon.stub(require('sharp').prototype, 'resize').returns({
      toBuffer: () => resizedImageBuffer
    });
    
    const message = {
      body: JSON.stringify({
        bucketName,
        fileName
      })
    };
    const event = { Records: [message] };
    const result = await handler(event);
    assert.isUndefined(result);
  });
});