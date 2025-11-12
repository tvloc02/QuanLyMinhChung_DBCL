// frontend/services/publicEvidenceService.js - FULL CODE

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export const publicEvidenceAPI = {
    // Lấy minh chứng theo ID
    getById: async (id) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/public/evidences/id/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Lấy minh chứng theo code
    getByCode: async (code) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/public/evidences/${code}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Lấy toàn bộ cấu trúc phân cấp (Năm học, Chương trình, Tổ chức, Tiêu chuẩn, Tiêu chí, Minh chứng)
    getHierarchy: async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/public/evidences/hierarchy`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // ✅ Lọc minh chứng theo các tiêu chí phân cấp
    getEvidencesByHierarchy: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            
            if (filters.academicYearId) params.append('academicYearId', filters.academicYearId);
            if (filters.programId) params.append('programId', filters.programId);
            if (filters.organizationId) params.append('organizationId', filters.organizationId);
            if (filters.standardId) params.append('standardId', filters.standardId);
            if (filters.criteriaId) params.append('criteriaId', filters.criteriaId);

            const response = await axios.get(
                `${API_BASE_URL}/api/public/evidences/hierarchy/search?${params.toString()}`
            );
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

export default publicEvidenceAPI;