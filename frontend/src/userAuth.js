// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const jwtToken = localStorage.getItem('jwt_access_token');
    const userSub = localStorage.getItem('user_sub');

    if (jwtToken && userSub) {
      setUser({
        jwtToken,
        userSub,
      });
    }
  }, []);

  const login = (jwtToken, userSub) => {
    localStorage.setItem('jwt_access_token', jwtToken);
    localStorage.setItem('user_sub', userSub);

    setUser({
      jwtToken,
      userSub,
    });
  };

  const logout = () => {
    localStorage.removeItem('jwt_access_token');
    localStorage.removeItem('user_sub');

    setUser(null);
  };

  return { user, login, logout };
};

export default useAuth;