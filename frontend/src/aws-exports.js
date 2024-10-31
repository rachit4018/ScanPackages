// src/aws-exports.js
const awsmobile = {
    Auth: {
      // Required
      identityPoolId: process.env.REACT_APP_identityPoolId, // e.g. 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx'
      region: process.env.REACT_APP_awsRegion, // e.g. 'us-east-1'
      userPoolId: process.env.REACT_APP_userPoolId, // e.g. 'us-east-1_xxxxxx'
      userPoolWebClientId: process.env.REACT_APP_clientId, // e.g. 'xxxxxxxxxx'
    },
    Storage: {
      bucket: process.env.REACT_APP_bucketName, // e.g. 'myappbucket'
      region: process.env.REACT_APP_awsRegion, // e.g. 'us-east-1'
    },
  };
  
  export default awsmobile;
  