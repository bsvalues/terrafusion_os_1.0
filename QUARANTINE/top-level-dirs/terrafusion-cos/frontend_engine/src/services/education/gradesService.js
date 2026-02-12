/**
 * Education Grades Service
 * Handles all grade-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all grades
 */
export const getGrades = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.EDUCATION.GRADES}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch class grades
 */
export const getClassGrades = async (classId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/class/${classId}`);
};

/**
 * Fetch student grades
 */
export const getStudentGrades = async (studentId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/student/${studentId}`);
};

/**
 * Enter grade
 */
export const enterGrade = async (gradeData) => {
  return await apiRequest(API_ENDPOINTS.EDUCATION.GRADES, {
    method: 'POST',
    body: JSON.stringify(gradeData),
  });
};

/**
 * Update grade
 */
export const updateGrade = async (gradeId, data) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/${gradeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Get grade distribution
 */
export const getGradeDistribution = async (classId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/distribution/${classId}`);
};

/**
 * Get grade statistics
 */
export const getGradeStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/stats`);
};

/**
 * Calculate GPA
 */
export const calculateGPA = async (studentId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/gpa/${studentId}`);
};

/**
 * Get recent grade entries
 */
export const getRecentGrades = async (limit = 10) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.GRADES}/recent?limit=${limit}`);
};

export default {
  getGrades,
  getClassGrades,
  getStudentGrades,
  enterGrade,
  updateGrade,
  getGradeDistribution,
  getGradeStats,
  calculateGPA,
  getRecentGrades,
};
