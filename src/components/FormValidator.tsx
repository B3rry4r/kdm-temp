import { useState } from 'react';

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | null;
};

export type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule;
};

export function useFormValidator<T extends Record<string, any>>(
  schema: ValidationSchema<T>,
  values: T
) {
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    for (const key in schema) {
      const rules = schema[key];
      const value = values[key];
      if (!rules) continue;
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[key] = 'This field is required.';
        continue;
      }
      if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[key] = `Minimum length is ${rules.minLength}.`;
        continue;
      }
      if (rules.maxLength && value && value.length > rules.maxLength) {
        newErrors[key] = `Maximum length is ${rules.maxLength}.`;
        continue;
      }
      if (rules.email && value && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
        newErrors[key] = 'Invalid email address.';
        continue;
      }
      if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[key] = 'Invalid format.';
        continue;
      }
      if (rules.custom) {
        const customError = rules.custom(value);
        if (customError) {
          newErrors[key] = customError;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return { errors, validate };
} 