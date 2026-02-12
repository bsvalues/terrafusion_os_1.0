/**
 * Education Management Hooks
 * Custom React hooks for Education Portal
 */

import { useState, useEffect, useCallback } from 'react';
import * as studentsService from '../services/education/studentsService';
import * as gradesService from '../services/education/gradesService';

/**
 * Hook for student information management
 */
export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await studentsService.getAllStudents();
      if (result.success) {
        setStudents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createStudent = async (data) => {
    try {
      const result = await studentsService.createStudent(data);
      if (result.success) {
        setStudents(prev => [result.data, ...prev]);
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateStudent = async (id, data) => {
    try {
      const result = await studentsService.updateStudent(id, data);
      if (result.success) {
        setStudents(prev => 
          prev.map(item => item.id === id ? result.data : item)
        );
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteStudent = async (id) => {
    try {
      const result = await studentsService.deleteStudent(id);
      if (result.success) {
        setStudents(prev => prev.filter(item => item.id !== id));
        return { success: true };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    refetch: fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
  };
};

/**
 * Hook for grade management and analytics
 */
export const useGrades = (classId = null, studentId = null) => {
  const [grades, setGrades] = useState([]);
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      if (classId) {
        result = await gradesService.getGradesByClass(classId);
      } else if (studentId) {
        result = await gradesService.getGradesByStudent(studentId);
      }

      if (result && result.success) {
        setGrades(result.data);
      }

      // Always fetch distribution for analytics
      const distResult = await gradesService.getGradeDistribution();
      if (distResult.success) {
        setDistribution(distResult.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [classId, studentId]);

  const updateGrade = async (data) => {
    try {
      const result = await gradesService.updateGrade(data);
      if (result.success) {
        setGrades(prev => 
          prev.map(item => 
            item.student_id === data.student_id && item.assignment_id === data.assignment_id 
              ? result.data 
              : item
          )
        );
        return { success: true, data: result.data };
      }
      return { success: false, error: result.error };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchGrades();
  }, [fetchGrades]);

  return {
    grades,
    distribution,
    loading,
    error,
    refetch: fetchGrades,
    updateGrade,
  };
};
