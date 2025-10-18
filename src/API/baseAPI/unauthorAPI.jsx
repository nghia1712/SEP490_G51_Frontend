import axios from 'axios';

// Use Vite proxy to call backend at /api
const unauthorApi = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

export default unauthorApi;