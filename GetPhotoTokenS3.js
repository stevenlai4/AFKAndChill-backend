const region = 'us-east-2';
const bucketName = 'afk-and-chill-bucket';
const S3 = require('aws-sdk/clients/s3');
// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 60;
const getUploadURL = async function (event) {
    const s3 = new S3({
        region,
        signatureVersion: 'v4',
    });
    const randomID = parseInt(Math.random() * 10000000);
    const Key = `${randomID}`;
    // Get signed URL from S3
    const s3Params = {
        Bucket: bucketName,
        Key,
        Expires: URL_EXPIRATION_SECONDS,
    };
    const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);
    return {
        uploadURL: uploadURL,
        Key,
    };
};
// Main Lambda entry point
exports.handler = async (event) => {
    return await getUploadURL(event);
};
