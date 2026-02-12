/**
 * Terrafusion Form Validation System
 * A comprehensive form validation system for Terrafusion applications
 */

const terraFusionForms = (function() {
  'use strict';
  
  // Store registered forms and their validators
  const registeredForms = new Map();
  
  // Default validation rules
  const defaultValidators = {
    required: {
      validate: function(value) {
        if (typeof value === 'string') {
          return value.trim().length > 0;
        }
        return value !== null && value !== undefined && value !== '';
      },
      message: 'This field is required'
    },
    email: {
      validate: function(value) {
        if (!value) return true; // Skip if empty (use required for that)
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(value);
      },
      message: 'Please enter a valid email address'
    },
    minLength: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        return value.length >= param;
      },
      message: 'Please enter at least {0} characters'
    },
    maxLength: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        return value.length <= param;
      },
      message: 'Please enter no more than {0} characters'
    },
    pattern: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        // If param is an object with a value property, use that
        const pattern = typeof param === 'object' ? new RegExp(param.value) : new RegExp(param);
        return pattern.test(value);
      },
      message: 'Please enter a valid value'
    },
    numeric: {
      validate: function(value) {
        if (!value) return true; // Skip if empty
        return !isNaN(parseFloat(value)) && isFinite(value);
      },
      message: 'Please enter a valid number'
    },
    integer: {
      validate: function(value) {
        if (!value) return true; // Skip if empty
        return Number.isInteger(Number(value));
      },
      message: 'Please enter a valid integer'
    },
    min: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        return Number(value) >= param;
      },
      message: 'Please enter a value greater than or equal to {0}'
    },
    max: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        return Number(value) <= param;
      },
      message: 'Please enter a value less than or equal to {0}'
    },
    equalTo: {
      validate: function(value, param) {
        if (!value) return true; // Skip if empty
        const targetElement = document.querySelector(param);
        return targetElement ? value === targetElement.value : true;
      },
      message: 'Values must match'
    },
    date: {
      validate: function(value) {
        if (!value) return true; // Skip if empty
        return !isNaN(Date.parse(value));
      },
      message: 'Please enter a valid date'
    },
    url: {
      validate: function(value) {
        if (!value) return true; // Skip if empty
        try {
          new URL(value);
          return true;
        } catch (e) {
          return false;
        }
      },
      message: 'Please enter a valid URL'
    }
  };
  
  // Create Form Validator class
  class FormValidator {
    constructor(formId, options, rules) {
      this.formId = formId;
      this.form = document.getElementById(formId);
      this.options = Object.assign({
        validateOnInput: false,
        validateOnBlur: true,
        validateOnSubmit: true,
        showValidationMessages: true,
        preventSubmitOnError: true,
        scrollToFirstError: true,
        customErrorContainer: null,
        errorClass: 'is-invalid',
        successClass: 'is-valid'
      }, options);
      
      this.rules = rules || {};
      this.validators = { ...defaultValidators };
      this.errors = new Map();
      
      this.init();
    }
    
    init() {
      if (!this.form) {
        console.error(`Form with ID "${this.formId}" not found.`);
        return;
      }
      
      // Add CSS classes for Bootstrap validation
      this.form.classList.add('needs-validation');
      this.form.setAttribute('novalidate', '');
      
      // Set up event listeners
      this.setupEventListeners();
    }
    
    setupEventListeners() {
      const self = this;
      
      // Form submit event
      if (this.options.validateOnSubmit) {
        this.form.addEventListener('submit', function(e) {
          const isValid = self.validate();
          
          if (!isValid && self.options.preventSubmitOnError) {
            e.preventDefault();
            e.stopPropagation();
            
            if (self.options.scrollToFirstError) {
              const firstErrorField = self.form.querySelector(`.${self.options.errorClass}`);
              if (firstErrorField) {
                firstErrorField.focus();
                firstErrorField.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }
          }
        });
      }
      
      // Field-level validation on input
      if (this.options.validateOnInput) {
        this.form.addEventListener('input', function(e) {
          const field = e.target;
          const fieldName = field.name;
          
          if (fieldName && self.rules[fieldName]) {
            self.validateField(fieldName);
          }
        });
      }
      
      // Field-level validation on blur
      if (this.options.validateOnBlur) {
        this.form.addEventListener('blur', function(e) {
          const field = e.target;
          const fieldName = field.name;
          
          if (fieldName && self.rules[fieldName]) {
            self.validateField(fieldName);
          }
        }, true);
      }
    }
    
    validate() {
      // Reset previous errors
      this.errors.clear();
      
      // Reset form validation state
      this.form.classList.remove('was-validated');
      
      const formFields = this.form.elements;
      let isValid = true;
      
      // Validate all fields with rules
      for (const fieldName in this.rules) {
        if (!this.validateField(fieldName)) {
          isValid = false;
        }
      }
      
      // Add was-validated class to show validation state
      if (this.options.showValidationMessages) {
        this.form.classList.add('was-validated');
      }
      
      // Display errors in custom container if specified
      if (this.options.customErrorContainer && this.errors.size > 0) {
        this.displayErrorsInContainer();
      }
      
      return isValid;
    }
    
    validateField(fieldName) {
      const field = this.form.elements[fieldName];
      if (!field) return true; // Skip if field not found
      
      const fieldRules = this.rules[fieldName];
      if (!fieldRules) return true; // Skip if no rules for this field
      
      // Get field value
      let value = field.type === 'checkbox' ? field.checked : field.value;
      
      // Remove previous validation state
      field.classList.remove(this.options.errorClass);
      field.classList.remove(this.options.successClass);
      
      // Find or create feedback elements
      let invalidFeedback = this.findOrCreateFeedback(field, 'invalid');
      
      let isFieldValid = true;
      let errorMessages = [];
      
      // Validate against each rule
      for (const ruleName in fieldRules) {
        const ruleValue = fieldRules[ruleName];
        
        // Skip if rule value is not truthy (allows conditional validation)
        if (!ruleValue) continue;
        
        const validator = this.validators[ruleName];
        if (!validator) {
          console.warn(`Unknown validator: ${ruleName}`);
          continue;
        }
        
        // Get the rule parameter (could be a value or an object with value and message)
        const ruleParam = typeof ruleValue === 'object' && ruleValue !== null ? 
          ruleValue.value : ruleValue;
        
        // Validate the field
        const isValid = validator.validate(value, ruleParam);
        
        if (!isValid) {
          isFieldValid = false;
          
          // Get custom message if provided
          let errorMessage = typeof ruleValue === 'object' && ruleValue !== null && ruleValue.message ? 
            ruleValue.message : validator.message;
          
          // Replace any parameters in the message
          if (typeof ruleParam !== 'object' && ruleParam !== null) {
            errorMessage = errorMessage.replace('{0}', ruleParam);
          }
          
          errorMessages.push(errorMessage);
        }
      }
      
      // Update validation state
      if (!isFieldValid) {
        // Add error class
        field.classList.add(this.options.errorClass);
        
        // Update feedback message
        if (invalidFeedback && errorMessages.length > 0) {
          invalidFeedback.textContent = errorMessages[0]; // Show first error
        }
        
        // Store errors
        this.errors.set(fieldName, errorMessages);
      } else {
        // Add success class
        field.classList.add(this.options.successClass);
      }
      
      return isFieldValid;
    }
    
    findOrCreateFeedback(field, type) {
      const fieldId = field.id || field.name;
      const feedbackClass = `${type}-feedback`;
      
      // Try to find existing feedback element
      let feedback = field.nextElementSibling;
      
      if (feedback && feedback.classList.contains(feedbackClass)) {
        return feedback;
      } else {
        // Check if there's a container (form-group, etc.)
        const container = field.closest('.form-group, .mb-3');
        if (container) {
          feedback = container.querySelector(`.${feedbackClass}`);
          if (feedback) {
            return feedback;
          }
        }
      }
      
      // Don't create new elements if not showing messages
      if (!this.options.showValidationMessages) {
        return null;
      }
      
      // Create a new feedback element if needed
      feedback = document.createElement('div');
      feedback.classList.add(feedbackClass);
      feedback.id = `${fieldId}-${type}-feedback`;
      
      // Insert after field or at the end of container
      if (field.nextElementSibling) {
        field.parentNode.insertBefore(feedback, field.nextElementSibling);
      } else {
        field.parentNode.appendChild(feedback);
      }
      
      return feedback;
    }
    
    displayErrorsInContainer() {
      const container = document.querySelector(this.options.customErrorContainer);
      if (!container) return;
      
      // Clear previous content
      container.innerHTML = '';
      
      // Create error list
      const errorHeading = document.createElement('h5');
      errorHeading.className = 'tf-validation-error-heading';
      errorHeading.textContent = 'Please fix the following errors:';
      
      const errorList = document.createElement('ul');
      errorList.className = 'tf-validation-error-list';
      
      this.errors.forEach((messages, fieldName) => {
        const field = this.form.elements[fieldName];
        const fieldLabel = this.getFieldLabel(field);
        
        messages.forEach(message => {
          const listItem = document.createElement('li');
          listItem.innerHTML = `<strong>${fieldLabel}:</strong> ${message}`;
          
          // Add click event to focus the field
          listItem.addEventListener('click', function() {
            field.focus();
          });
          
          errorList.appendChild(listItem);
        });
      });
      
      container.appendChild(errorHeading);
      container.appendChild(errorList);
      container.style.display = 'block';
    }
    
    getFieldLabel(field) {
      // Try to find label for the field
      const fieldId = field.id;
      if (fieldId) {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label) {
          return label.textContent;
        }
      }
      
      // Try parent label
      const parentLabel = field.closest('label');
      if (parentLabel) {
        // Strip any child elements' text
        const clone = parentLabel.cloneNode(true);
        Array.from(clone.querySelectorAll('input, select, textarea')).forEach(el => el.remove());
        return clone.textContent.trim();
      }
      
      // Fallback to field name or placeholder
      return field.getAttribute('placeholder') || field.name;
    }
    
    hasErrors() {
      return this.errors.size > 0;
    }
    
    getErrors() {
      return Object.fromEntries(this.errors);
    }
    
    reset() {
      this.errors.clear();
      
      // Reset all form elements
      Array.from(this.form.elements).forEach(field => {
        field.classList.remove(this.options.errorClass, this.options.successClass);
      });
      
      // Reset form validation state
      this.form.classList.remove('was-validated');
      
      // Clear custom error container
      if (this.options.customErrorContainer) {
        const container = document.querySelector(this.options.customErrorContainer);
        if (container) {
          container.innerHTML = '';
          container.style.display = 'none';
        }
      }
    }
    
    resetField(fieldName) {
      const field = this.form.elements[fieldName];
      if (!field) return;
      
      field.classList.remove(this.options.errorClass, this.options.successClass);
      
      // Clear feedback messages
      const invalidFeedback = this.findOrCreateFeedback(field, 'invalid');
      if (invalidFeedback) {
        invalidFeedback.textContent = '';
      }
      
      // Remove from errors map
      this.errors.delete(fieldName);
    }
    
    setRules(rules) {
      this.rules = { ...this.rules, ...rules };
    }
    
    getRules() {
      return this.rules;
    }
    
    addValidator(name, validator) {
      if (!validator.validate || typeof validator.validate !== 'function') {
        console.error('Validator must have a validate function.');
        return;
      }
      
      this.validators[name] = validator;
    }
    
    removeValidator(name) {
      delete this.validators[name];
    }
    
    destroy() {
      // Clean up event listeners
      // Note: Current setup doesn't allow for specific removeEventListener
      
      // Remove validation classes
      this.form.classList.remove('needs-validation', 'was-validated');
      
      // Remove validation attributes
      this.form.removeAttribute('novalidate');
      
      // Remove field classes
      Array.from(this.form.elements).forEach(field => {
        field.classList.remove(this.options.errorClass, this.options.successClass);
      });
      
      // Remove from registry
      registeredForms.delete(this.formId);
    }
  }
  
  return {
    register: function(formId, options, rules) {
      // If already registered, return existing or create new
      if (registeredForms.has(formId)) {
        const existing = registeredForms.get(formId);
        
        // Update options and rules if provided
        if (options) {
          existing.options = Object.assign(existing.options, options);
        }
        
        if (rules) {
          existing.setRules(rules);
        }
        
        return existing;
      }
      
      // Create new validator
      const validator = new FormValidator(formId, options, rules);
      registeredForms.set(formId, validator);
      return validator;
    },
    
    get: function(formId) {
      return registeredForms.get(formId);
    },
    
    validate: function(formId) {
      const validator = registeredForms.get(formId);
      return validator ? validator.validate() : false;
    },
    
    reset: function(formId) {
      const validator = registeredForms.get(formId);
      if (validator) {
        validator.reset();
      }
    },
    
    unregister: function(formId) {
      const validator = registeredForms.get(formId);
      if (validator) {
        validator.destroy();
      }
    },
    
    validateOnLoad: function() {
      // Initialize validation for forms with data-tf-validate attribute
      document.querySelectorAll('form[data-tf-validate]').forEach(form => {
        const formId = form.id;
        if (!formId) {
          console.warn('Form with data-tf-validate must have an id attribute.');
          return;
        }
        
        // Get options from data attributes
        const options = {
          validateOnInput: form.dataset.tfValidateOnInput === 'true',
          validateOnBlur: form.dataset.tfValidateOnBlur !== 'false',
          validateOnSubmit: form.dataset.tfValidateOnSubmit !== 'false',
          showValidationMessages: form.dataset.tfShowMessages !== 'false',
          preventSubmitOnError: form.dataset.tfPreventSubmit !== 'false',
          scrollToFirstError: form.dataset.tfScrollToError !== 'false',
          customErrorContainer: form.dataset.tfErrorContainer || null
        };
        
        // Create validator
        this.register(formId, options);
      });
    }
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  terraFusionForms.validateOnLoad();
});