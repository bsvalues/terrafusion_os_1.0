import { useState, useCallback } from 'react';
import { OnboardingFormData } from '../types';
import { validateEmail, validatePhone, transformFormData } from '../utils/helpers';

const initialFormData: OnboardingFormData = {
  countyName: '',
  state: '',
  population: '',
  area: '',
  established: '',
  website: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  departments: []
};

export const useOnboardingForm = () => {
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors: Partial<Record<keyof OnboardingFormData, string>> = {};

    if (!formData.countyName.trim()) {
      newErrors.countyName = 'County name is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.population.trim()) {
      newErrors.population = 'Population is required';
    } else if (isNaN(Number(formData.population.replace(/,/g, '')))) {
      newErrors.population = 'Population must be a valid number';
    }

    if (!formData.area.trim()) {
      newErrors.area = 'Area is required';
    } else if (isNaN(Number(formData.area.replace(/,/g, '')))) {
      newErrors.area = 'Area must be a valid number';
    }

    if (!formData.established.trim()) {
      newErrors.established = 'Establishment date is required';
    }

    if (!formData.website.trim()) {
      newErrors.website = 'Website is required';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else if (!validateEmail(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email format';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!validatePhone(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone format';
    }

    if (!formData.contactAddress.trim()) {
      newErrors.contactAddress = 'Contact address is required';
    }

    if (formData.departments.length === 0) {
      newErrors.departments = 'At least one department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const transformedData = transformFormData(formData);
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting form:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  const handleInputChange = useCallback((field: keyof OnboardingFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  }, [errors]);

  const addDepartment = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      departments: [
        ...prev.departments,
        { name: '', head: '', description: '' },
      ],
    }));
  }, []);

  const removeDepartment = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.filter((_, i) => i !== index),
    }));
  }, []);

  const updateDepartment = useCallback((
    index: number,
    field: 'name' | 'head' | 'description',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      departments: prev.departments.map((dept, i) =>
        i === index ? { ...dept, [field]: value } : dept
      ),
    }));
  }, []);

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    addDepartment,
    removeDepartment,
    updateDepartment,
  };
}; 