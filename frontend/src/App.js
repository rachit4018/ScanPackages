import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/signUp';
// import Logout from './components/Logout';
import UploadImage from './components/fileUpload';
import CardList from './components/list';
import VerifyEmail from './components/verifyEmail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path='/verifyEmail' element={<VerifyEmail />} />
        {/* <Route path="/logout" element={<Logout />} /> */}
        <Route path="/upload-image" element={<UploadImage />} />
        <Route path="/cards" element={<CardList userId="100" />} />
      </Routes>
    </Router>
  );
}

export default App;
