import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const publicEvidenceAPI = {
    // Lấy minh chứng theo code
    getByCode: async (code) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/public/evidences/${code}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching evidence by code:', error);
            throw error;
        }
    },

    // Lấy minh chứng theo ID
    getById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/public/evidences/id/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching evidence by ID:', error);
            throw error;
        }
    }
};

export default publicEvidenceAPI;