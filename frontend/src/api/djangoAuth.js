import axios from 'axios';

const djangoApi = axios.create({
  baseURL: process.env.REACT_APP_DJANGO_API_URL,
});

export const login = (credentials) => djangoApi.post('/login', credentials);
export const signup = (data) => djangoApi.post('/signup', data);
export const logout = () => djangoApi.post('/logout');
