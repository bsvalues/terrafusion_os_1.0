/**
 * Education Students Service
 * Handles all student-related API calls
 */

import { apiRequest, API_ENDPOINTS } from '../api';

/**
 * Fetch all students
 */
export const getStudents = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const endpoint = `${API_ENDPOINTS.EDUCATION.STUDENTS}${queryParams ? `?${queryParams}` : ''}`;
  return await apiRequest(endpoint);
};

/**
 * Fetch student by ID
 */
export const getStudentById = async (studentId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/${studentId}`);
};

/**
 * Create new student
 */
export const createStudent = async (studentData) => {
  return await apiRequest(API_ENDPOINTS.EDUCATION.STUDENTS, {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
};

/**
 * Update student
 */
export const updateStudent = async (studentId, data) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/${studentId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete student
 */
export const deleteStudent = async (studentId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/${studentId}`, {
    method: 'DELETE',
  });
};

/**
 * Get student statistics
 */
export const getStudentStats = async () => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/stats`);
};

/**
 * Get student performance
 */
export const getStudentPerformance = async (studentId) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/${studentId}/performance`);
};

/**
 * Get student attendance
 */
export const getStudentAttendance = async (studentId, dateRange) => {
  return await apiRequest(`${API_ENDPOINTS.EDUCATION.STUDENTS}/${studentId}/attendance`, {
    method: 'POST',
    body: JSON.stringify({ dateRange }),
  });
};

export default {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentStats,
  getStudentPerformance,
  getStudentAttendance,
};
