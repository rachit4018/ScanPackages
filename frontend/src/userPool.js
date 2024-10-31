// userPool.js
import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: process.env.REACT_APP_userPoolId,
    ClientId: process.env.REACT_APP_clientId,
};

// Create a CognitoUserPool instance
const userPool = new CognitoUserPool(poolData);

// Add a method to retrieve UserPoolId
userPool.getUserPoolId = () => poolData.UserPoolId;

// Export the user pool instance
export default userPool;
