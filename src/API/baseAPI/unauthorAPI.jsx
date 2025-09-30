import axios from 'axios';

const unauthorApi = axios.create({
    baseURL: 'http://localhost:9999',
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

export default unauthorApi;
