import React, { useState } from "react";
import "../styles/infoCard.css";

InfoCard.propTypes = {};

const serverUrl = "http://127.0.0.1:8000";

function InfoCard(props) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const onSubmit = () => {
    console.log("props123: ", props.cardDetails);
// Api call 
    fetch(serverUrl + "/cards", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        card_id: props.cardDetails.card_id,
        user_id: localStorage.getItem("user_sub") || "",
        b_name: props.cardDetails.b_name ? [props.cardDetails.b_name] : [""],
        Telephone: props.cardDetails.phone
          ? [props.cardDetails.phone]
          : [""],
        Email: props.cardDetails.email
          ? [props.cardDetails.email]
          : [""],
        Website: props.cardDetails.website
          ? props.cardDetails.website
          : "",
        Address: props.cardDetails.address
          ? props.cardDetails.address
          : "",
        image_storage: props.cardDetails.image_url,
      }),
    })
      .then((response) => response.json())
      .then((res) => {
        console.log("res555", res);
        setOpen(true);
      })
      .catch((error) => {
        console.log(error);
        setOpen(true);
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
            id="phone"
            className="input"
            type="text"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "phone")}
            value={props.cardDetails.phone || ""}
          />
          <label htmlFor="phone" className="placeholder">
            Phone
          </label>
        </div>

        <div className="input-container">
          <input
            id="email"
            className="input"
            type="text"
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
            id="website"
            className="input"
            type="text"
            placeholder=" "
            onChange={(event) => props.handleChangeInput(event, "website")}
            value={props.cardDetails.website || ""}
          />
          <label htmlFor="website" className="placeholder">
            Website
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
