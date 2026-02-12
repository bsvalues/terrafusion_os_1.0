import { useState, useCallback } from 'react';
import { useErrorState } from './useErrorState';
import { useNotificationState } from './useNotificationState';

export type ValidationRule<T> = (value: T) => string | null;

export interface FormField<T> {
  value: T;
  error: string | null;
  touched: boolean;
  rules: ValidationRule<T>[];
}

export interface FormState<T extends Record<string, any>> {
  fields: {
    [K in keyof T]: FormField<T[K]>;
  };
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

export const useFormState = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: {
    [K in keyof T]?: ValidationRule<T[K]>[];
  } = {}
) => {
  const [state, setState] = useState<FormState<T>>(() => ({
    fields: Object.keys(initialValues).reduce(
      (acc, key) => ({
        ...acc,
        [key]: {
          value: initialValues[key],
          error: null,
          touched: false,
          rules: validationRules[key] || [],
        },
      }),
      {} as FormState<T>['fields']
    ),
    isValid: true,
    isDirty: false,
    isSubmitting: false,
  }));

  const { setErrorState } = useErrorState();
  const { error: notifyError } = useNotificationState();

  const validateField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ): string | null => {
    const rules = state.fields[field].rules;
    for (const rule of rules) {
      const error = rule(value);
      if (error) {
        return error;
      }
    }
    return null;
  }, [state.fields]);

  const validateForm = useCallback((): boolean => {
    const newFields = { ...state.fields };
    let isValid = true;

    Object.keys(newFields).forEach((key) => {
      const field = key as keyof T;
      const error = validateField(field, newFields[field].value);
      newFields[field] = {
        ...newFields[field],
        error,
      };
      if (error) {
        isValid = false;
      }
    });

    setState((prev) => ({
      ...prev,
      fields: newFields,
      isValid,
    }));

    return isValid;
  }, [state.fields, validateField]);

  const setFieldValue = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ) => {
    setState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          value,
          error: validateField(field, value),
          touched: true,
        },
      },
      isDirty: true,
    }));
  }, [validateField]);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setState((prev) => ({
      ...prev,
      fields: {
        ...prev.fields,
        [field]: {
          ...prev.fields[field],
          touched: true,
          error: validateField(field, prev.fields[field].value),
        },
      },
    }));
  }, [validateField]);

  const resetForm = useCallback(() => {
    setState((prev) => ({
      ...prev,
      fields: Object.keys(prev.fields).reduce(
        (acc, key) => ({
          ...acc,
          [key]: {
            ...prev.fields[key],
            value: initialValues[key],
            error: null,
            touched: false,
          },
        }),
        {} as FormState<T>['fields']
      ),
      isValid: true,
      isDirty: false,
    }));
  }, [initialValues]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void>
  ) => {
    if (!validateForm()) {
      notifyError('Please fix the form errors before submitting');
      return;
    }

    setState((prev) => ({ ...prev, isSubmitting: true }));

    try {
      const values = Object.keys(state.fields).reduce(
        (acc, key) => ({
          ...acc,
          [key]: state.fields[key].value,
        }),
        {} as T
      );

      await onSubmit(values);
    } catch (error) {
      setErrorState(error);
      notifyError('Form submission failed');
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [state.fields, validateForm, setErrorState, notifyError]);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => {
    return {
      value: state.fields[field].value,
      error: state.fields[field].error,
      touched: state.fields[field].touched,
      onChange: (value: T[K]) => setFieldValue(field, value),
      onBlur: () => setFieldTouched(field),
    };
  }, [state.fields, setFieldValue, setFieldTouched]);

  return {
    values: Object.keys(state.fields).reduce(
      (acc, key) => ({
        ...acc,
        [key]: state.fields[key].value,
      }),
      {} as T
    ),
    errors: Object.keys(state.fields).reduce(
      (acc, key) => ({
        ...acc,
        [key]: state.fields[key].error,
      }),
      {} as Record<keyof T, string | null>
    ),
    touched: Object.keys(state.fields).reduce(
      (acc, key) => ({
        ...acc,
        [key]: state.fields[key].touched,
      }),
      {} as Record<keyof T, boolean>
    ),
    isValid: state.isValid,
    isDirty: state.isDirty,
    isSubmitting: state.isSubmitting,
    setFieldValue,
    setFieldTouched,
    resetForm,
    handleSubmit,
    getFieldProps,
  };
}; 