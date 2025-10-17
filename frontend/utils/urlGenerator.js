// frontend/utils/urlGenerator.js

const getPublicUrl = () => {
    // Client-side: use window.location
    if (typeof window !== 'undefined') {
        // Get protocol + domain
        const { protocol, hostname, port } = window.location

        // Handle localhost vs production
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return `${protocol}//${hostname}:${process.env.NEXT_PUBLIC_WEB_PORT || port}`
        }

        return `${protocol}//${window.location.host}`
    }

    // Server-side fallback
    return process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'
}

/**
 * Generate URL to public evidence page
 * @param {string} code - Evidence code (e.g., H1.01.01.01)
 * @returns {string} Full URL
 */
export const generateEvidenceUrl = (code) => {
    const baseUrl = getPublicUrl()
    return `${baseUrl}/public/evidences/${code}`
}

/**
 * Generate URL to public report page
 * @param {string} code - Report code
 * @returns {string} Full URL
 */
export const generateReportUrl = (code) => {
    const baseUrl = getPublicUrl()
    return `${baseUrl}/public/reports/${code}`
}

/**
 * Convert evidence links in content
 * Chuyển code minh chứng (VD: H1.01.01.01) thành link động
 *
 * @param {string} content - HTML content
 * @returns {string} Content with evidence links
 */
export const processEvidenceLinksForDownload = (content) => {
    if (!content) return '';

    // Pattern: H1.01.01.01 (bắt đầu A-Z, theo sau số)
    const evidenceCodePattern = /\b([A-Y]\d+\.\d{2}\.\d{2}\.\d{2})\b/g;

    return content.replace(evidenceCodePattern, (match) => {
        const url = generateEvidenceUrl(match);
        return `<a href="${url}" class="evidence-link" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.25rem 0.75rem; background-color: #dbeafe; color: #1e40af; border-radius: 0.375rem; font-family: monospace; font-weight: 600; font-size: 0.875rem; text-decoration: none; border: 1px solid #7dd3fc;">${match}</a>`;
    });
};

/**
 * Generate download URL for file
 * @param {string} fileId - File MongoDB ID
 * @returns {string} Download URL
 */
export const generateFileDownloadUrl = (fileId) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    return `${apiUrl}/files/${fileId}/download`;
};

/**
 * Get API base URL
 * @returns {string} API URL
 */
export const getApiUrl = () => {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export default {
    getPublicUrl,
    generateEvidenceUrl,
    generateReportUrl,
    processEvidenceLinksForDownload,
    generateFileDownloadUrl,
    getApiUrl
};