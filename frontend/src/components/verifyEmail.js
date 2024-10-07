import { useState } from "react";
import { CognitoUser } from "amazon-cognito-identity-js";
import UserPool from "../userPool";


function Verify(props){
    const [verificationCode, setVerificationCode] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [email,setEmail] = useState("");
    const [successMessage, setSucessMessage] = useState("");

    const onSubmit = event => {
        event.preventDefault();

        const user = new CognitoUser({
            Username: email,
            Pool: UserPool,
        });

        user.confirmRegistration(verificationCode, true, (err, result) =>{
            if (err) {
                console.error(err);
                setErrorMessage(err.message);
            } else {
                setSucessMessage("Verification successful!");
                window.location = "/login";
            }

            
        });

    };
    return (
        <div style={styles.container}>
            <div style={styles.formContainer}>
                <div style={styles.titleContainer}>
                    <h2 style={styles.title}>Verify Account</h2>
                </div>
                <form onSubmit={onSubmit}>
                    <div style={styles.inputContainer}>
                        <label htmlFor="email" style={styles.label}>Email:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                            placeholder="Enter your email"
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.inputContainer}>
                        <label htmlFor="verificationCode" style={styles.label}>Verification Code:</label>
                        <input
                            id="verificationCode"
                            type="text"
                            value={verificationCode}
                            onChange={event => setVerificationCode(event.target.value)}
                            placeholder="Enter the code sent to your email"
                            style={styles.input}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={styles.button}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2e8b57'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3CB371'}
                    >
                        Verify
                    </button>
                </form>
                {errorMessage && (
                    <div style={styles.messageContainerError}>
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div style={styles.messageContainerSuccess}>
                        {successMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
        padding: '20px',
    },
    formContainer: {
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    titleContainer: {
        textAlign: 'center',
        marginBottom: '20px',
    },
    title: {
        margin: 0,
        color: '#333',
    },
    inputContainer: {
        marginBottom: '20px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        color: '#333',
        fontSize: '16px',
    },
    input: {
        width: '100%',
        padding: '12px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    button: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#3CB371',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'background-color 0.3s',
    },
    messageContainerError: {
        marginTop: '20px',
        backgroundColor: '#ffdddd',
        padding: '15px',
        borderRadius: '5px',
        color: '#d8000c',
        textAlign: 'center',
    },
    messageContainerSuccess: {
        marginTop: '20px',
        backgroundColor: '#ddffdd',
        padding: '15px',
        borderRadius: '5px',
        color: '#28a745',
        textAlign: 'center',
    },
}

export default Verify;