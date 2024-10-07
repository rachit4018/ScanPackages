import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import "../styles/infoCard.css";

const serverUrl = "http://127.0.0.1:8000";

function InfoCard(props) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate(); // Call useNavigate at the top level of the component

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = () => {
    console.log("props123: ", props.cardDetails);

    // API call
    fetch(serverUrl + "/cards", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        package_id: props.cardDetails.package_id,
        user_id: localStorage.getItem("user_sub") || "",
        b_name: props.cardDetails.b_name ? [props.cardDetails.b_name] : [""],
        Email: props.cardDetails.email ? [props.cardDetails.email] : [""],
        Address: props.cardDetails.address ? props.cardDetails.address : "",
        recieved_date: props.cardDetails.recieved_date ? props.cardDetails.recieved_date : "",
        tracking_id: props.cardDetails.tracking_id ? props.cardDetails.tracking_id : "",
        image_storage: props.cardDetails.image_url,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("res555", res);
        setOpen(true);
        navigate("/cards"); // Use navigate here
      })
      .catch((error) => {
        console.log(error);
        setOpen(true);
        navigate("/cards"); // Use navigate here in case of error as well
      });
  };

  return (
    <div>
      <div className="form">
        <div className="title">Business Card Details</div>

        <div className="input-container">
          <input
            id="b_name"
            className="input"
            type="text"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "b_name")}
            value={props.cardDetails.b_name || ""}
          />
          <label htmlFor="name" className="placeholder">
            Name
          </label>
        </div>

    
        <div className="input-container">
          <input
            id="email"
            className="input"
            type="email"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "email")}
            value={props.cardDetails.email || ""}
          />
          <label htmlFor="email" className="placeholder">
            Email
          </label>
        </div>


        <div className="input-container">
          <input
            id="address"
            className="input"
            type="text"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "address")}
            value={props.cardDetails.address || ""}
          />
          <label htmlFor="address" className="placeholder">
            Address
          </label>
        </div>

        <div className="input-container">
          <input
            id="tracking_id"
            className="input"
            type="text"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "tracking_id")}
            value={props.cardDetails.tracking_id || ""}
          />
          <label htmlFor="tracking_id" className="placeholder">
            Tracking ID
          </label>
         
        </div>

        
        <button type="button" className="submit" onClick={onSubmit}>
          Submit
        </button>
      </div>

      {/* Simple Modal */}
      {open && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleClose}>
              &times;
            </span>
            <h2>Success</h2>
            <p>Card Details saved successfully!!!</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InfoCard;
