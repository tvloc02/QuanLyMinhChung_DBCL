import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const publicEvidenceAPI = {
    getById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/evidences/id/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default publicEvidenceAPI;