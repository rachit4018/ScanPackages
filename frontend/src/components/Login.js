import React, { useState, useEffect } from "react";
import { CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";
import UserPool from "../userPool";
import userAuth from "../userAuth";
import axios from 'axios';

function Login(props) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { login: authLogin, logout } = userAuth();
  const [sessionTimeout, setSessionTimeout] = useState(null);


  useEffect(() => {
    // Clear session after 2 minutes
    if (sessionTimeout) {
      const timer = setTimeout(() => {
        handleLogout();
      }, 2 * 60 * 1000); // 2 minutes in milliseconds

      return () => clearTimeout(timer); // Cleanup timer on unmount or on timeout change
    }
  }, [sessionTimeout]);

  const handleLogout = () => {
    // Clear the local storage and reset session state
    localStorage.removeItem("jwt_access_token");
    localStorage.removeItem("user_sub");
    setEmail("");
    setPassword("");
    setMessage("Session expired. Please log in again.");
    window.location = "/login"; // Redirect to login page
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setIsAuthenticating(true);

    const user = new CognitoUser({
      Username: email,
      Pool: UserPool,
    });

    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    // Try authenticating the user
    user.authenticateUser(authDetails, {
      onSuccess: async (data) => {
        console.log("Authentication successful: ", data);

        // Store JWT access token in local storage
        localStorage.setItem("jwt_access_token", data.accessToken.jwtToken);
        localStorage.setItem("user_sub", data.accessToken.payload.sub);

        // Start the session timeout
        setSessionTimeout(true);

        // Now check or create user in DynamoDB
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}`, // Replace with your actual Lambda endpoint
            {
              params: {
                userId: data.accessToken.payload.sub, // Cognito user sub as userId
                userEmail: email,
              },
              headers: {
                Authorization: `Bearer ${data.accessToken.jwtToken}`, // Include the JWT token for authorization
              },
            }
          );

          console.log("DynamoDB response: ", response.data);

          // Redirect after successful check/create
          window.location = `/upload-image?user_id=${data.accessToken.payload.sub}&email=${encodeURIComponent(email)}`;
        } catch (error) {
          console.error("Error while checking/creating user in DynamoDB:", error);
          setMessage("Error with user verification.");
        } finally {
          setIsAuthenticating(false);
        }
      },
      onFailure: (err) => {
        console.error("Authentication failed: ", err.message);
        setMessage(err.message);
        setIsAuthenticating(false);
      },
      newPasswordRequired: (data) => {
        console.log("New password required: ", data);
        setMessage("New password required.");
        setIsAuthenticating(false);
      },
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <div style={styles.titleContainer}>
          <h2 style={styles.title}>Login</h2>
        </div>
        <form onSubmit={onSubmit}>
          <div style={styles.inputContainer}>
            <label htmlFor="email" style={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              onChange={(event) => setEmail(event.target.value)}
              value={email}
              placeholder="Enter your email"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputContainer}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              onChange={(event) => setPassword(event.target.value)}
              value={password}
              style={styles.input}
              required
            />
          </div>
          <button
            type="submit"
            style={styles.button}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#2e8b57")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#3CB371")}
          >
            Login
          </button>
        </form>
        {message && <div style={styles.messageContainer}>{message}</div>}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "20px",
  },
  formContainer: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "10px",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  titleContainer: {
    textAlign: "center",
    marginBottom: "20px",
  },
  title: {
    margin: 0,
    color: "#333",
  },
  inputContainer: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#333",
    fontSize: "16px",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#3CB371",
    color: "white",
    border: "none",
    borderRadius: "5px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  messageContainer: {
    marginTop: "20px",
    backgroundColor: "#ffdddd",
    padding: "15px",
    borderRadius: "5px",
    color: "#d8000c",
    textAlign: "center",
  },
};

export default Login;
