// useSessionTimeout.js
import { useEffect } from 'react';
import userAuth from './userAuth';

const useSessionTimeout = (timeout) => {
    const { logout } = userAuth();

    useEffect(() => {
        let timer;

        const resetTimer = () => {
            // Clear any existing timer and start a new one
            clearTimeout(timer);
            timer = setTimeout(() => {
                alert('Session has expired due to inactivity. You will be logged out.');
                logout();  // Log out the user
                window.location = '/login';  // Redirect to login page
            }, timeout);
        };

        // List of events that reset the inactivity timer
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

        // Attach event listeners to reset the timer
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Start the initial timer when the component mounts
        resetTimer();

        // Cleanup event listeners and timer when the component unmounts
        return () => {
            clearTimeout(timer);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [timeout, logout]);  // Only rerun if timeout or logout changes
};

export default useSessionTimeout;
