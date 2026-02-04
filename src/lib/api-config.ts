/**
 * API Configuration - Uses environment variables
 * Automatically switches between local development and production
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
    BASE_URL: API_BASE_URL,
    BONUS_TEMPLATES: `${API_BASE_URL}/api/bonus-templates`,
    HEALTH: `${API_BASE_URL}/health`,
    DOCS: `${API_BASE_URL}/docs`,
};

export default API_BASE_URL;
