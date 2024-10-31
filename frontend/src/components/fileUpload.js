import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import InfoCard from "./infoCard";
import "../styles/fileUpload.css";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import useSessionTimeout from "../useSessionTimeout";

const sessionTimeout = 1 * 60 * 1000; // 2-minute session timeout
const serverUrl = "http://127.0.0.1:8000";

function FileUpload(props) {
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [startLoading, setStartLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    package_id: "",
    b_name: "",
    phone: "",
    address: "",
    image_url: "",
    user_id: "",
    recieved_date: "",
    tracking_id: ""
  });
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const [userId, setUserId] = useState(""); // State for user ID
  const[userEmail, setUserEmail] = useState(""); // State for user email
  useSessionTimeout(sessionTimeout);

  const handleChangeInput = (event, key) => {
    setCardDetails({ ...cardDetails, [key]: event.target.value });
  };

  useEffect(() => {
    if (image) {
      setImageUrl(URL.createObjectURL(image));
    }
  }, [image]);

  useEffect(() => {
    let jwtAccessToken = localStorage.getItem("jwt_access_token");
    if (!jwtAccessToken || !localStorage.getItem("user_sub")) {
      window.location = "/login";
    }
  }, []);

  useEffect(() => {
    // Extracting the user_id from the query string
    const queryParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = queryParams.get('user_id');
    const userEmailFromUrl = queryParams.get('email');
    console.log("Retrieved User ID from URL:", userIdFromUrl);
    console.log("Retrieved User Email from URL:", userEmailFromUrl);
    setUserId(userIdFromUrl); // Set the user ID in state for later use
    setUserEmail(userEmailFromUrl); // Set the user email in state for later use
  }, []);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  async function handleOnImageChange(e) {
    setImage(e.target.files[0]);
    let file = e.target.files[0];
    let converter = new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve(reader.result.toString().replace(/^data:(.*,)?/, ""));
      reader.onerror = (error) => reject(error);
    });
    let encodedString = await converter;
    setStartLoading(true);

    try {
      console.log("Sending user_id:", userId);
      console.log("Sending email:", userEmail);
      // Pass user_id in the first API call
      let response = await fetch(serverUrl + "/images", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          filename: file.name, 
          filebytes: encodedString,
          user_id: userId, // Include user_id in the request body
          userEmail: userEmail // Include user_email here as well if needed
        }),
      });

      let result = await response.json();
      let fileId = result.fileId;
      let fileUrl = result.fileUrl;

      response = await fetch(serverUrl + "/images/" + fileId + "/recognize_entities", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          user_id: userId, 
          userEmail: userEmail // Include user_email here as well if needed
        }) // Include user_id here as well if needed
      });

      let res = await response.json();

      // Check if there is an error in the response
      if (res.status === 'error' || !res || !res[0] || !res[1]) {
        // Set the error message and stop loading
        setErrorMessage(res.message || "An unexpected error occurred.");
        setStartLoading(false);
        return; // Exit the function early
      }

      // Proceed with setting card details if no error
      let cardObj = {};
      for (let i = 0; i < res[0].length; i++) {
        cardObj[res[0][i]] = res[1][i];
      }
      setCardDetails({
        package_id: cardObj.package_id ? cardObj.package_id : '',
        b_name: cardObj.b_name ? cardObj.b_name : '',
        address: cardObj.Address ? cardObj.Address : '',
        email: cardObj.Email ? cardObj.Email : '',
        user_id: cardObj.user_id ? cardObj.user_id : '',
        recieved_date: cardObj.recieved_date ? cardObj.recieved_date : '',
        tracking_id: cardObj.tracking_id ? cardObj.tracking_id : '',
        image_url: null,
      });
    } catch (error) {
      // Handle fetch or parsing errors
      console.log(error);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setStartLoading(false);
    }
  }

  if (errorMessage) {
    return (
      <div className="error-body">
        <div className="error-container">
          <h1>Error</h1>
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="body">
      <div className="container">
        <h1>Scan Package</h1>
        <input
          id="file"
          name="file"
          className="inputfile"
          type="file"
          accept="image/*"
          onChange={handleOnImageChange}
        ></input>
        <label htmlFor="file"> + Upload an image </label>
        <br />
        {startLoading && (
          <Box sx={{ textAlign: "center", marginTop: "40px" }}>
            <CircularProgress size={60} disabled={startLoading} />
          </Box>
        )}
      </div>
      <div className="mainContainer">
        {imageUrl && (
          <React.Fragment>
            <div className="imageStyle">
              <img src={imageUrl} width="600px" height="400px" />
            </div>
            <div className="infoContainer">
              <InfoCard
                cardDetails={cardDetails}
                handleChangeInput={handleChangeInput}
              />
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
