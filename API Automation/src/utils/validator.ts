export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class Validator {
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format', 'email');
    }
  }

  static validatePhone(phone: string): void {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      throw new ValidationError('Invalid phone number format', 'phone');
    }
  }

  static validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
  }

  static validateString(value: any, fieldName: string, minLength = 1, maxLength?: number): void {
    this.validateRequired(value, fieldName);
    
    if (typeof value !== 'string') {
      throw new ValidationError(`${fieldName} must be a string`, fieldName);
    }
    
    if (value.length < minLength) {
      throw new ValidationError(`${fieldName} must be at least ${minLength} characters`, fieldName);
    }
    
    if (maxLength && value.length > maxLength) {
      throw new ValidationError(`${fieldName} must be no more than ${maxLength} characters`, fieldName);
    }
  }

  static validateDate(date: string, fieldName: string): void {
    this.validateRequired(date, fieldName);
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new ValidationError(`Invalid date format for ${fieldName}`, fieldName);
    }
  }

  static validateEnum(value: any, allowedValues: readonly any[], fieldName: string): void {
    this.validateRequired(value, fieldName);
    
    if (!allowedValues.includes(value)) {
      throw new ValidationError(`${fieldName} must be one of: ${allowedValues.join(', ')}`, fieldName);
    }
  }

  static validateObject(obj: any, fieldName: string): void {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new ValidationError(`${fieldName} must be an object`, fieldName);
    }
  }

  static validateArray(arr: any, fieldName: string, minLength = 0): void {
    if (!Array.isArray(arr)) {
      throw new ValidationError(`${fieldName} must be an array`, fieldName);
    }
    
    if (arr.length < minLength) {
      throw new ValidationError(`${fieldName} must have at least ${minLength} items`, fieldName);
    }
  }
} 