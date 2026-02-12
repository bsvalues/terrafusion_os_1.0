/**
 * Terrafusion Platform - Form Validation
 * 
 * This module provides enhanced form validation with clear user feedback,
 * following the user workflow and data state communication improvements.
 */

class TerraFusionFormValidation {
  constructor(formSelector, options = {}) {
    this.form = document.querySelector(formSelector);
    if (!this.form) {
      console.error(`Form not found: ${formSelector}`);
      return;
    }
    
    this.options = {
      showInlineErrors: true,
      enableLiveValidation: true,
      validationMessages: {
        required: 'This field is required',
        email: 'Please enter a valid email address',
        minLength: 'Please enter at least {min} characters',
        maxLength: 'Please enter no more than {max} characters',
        pattern: 'Please enter a valid value',
        number: 'Please enter a valid number',
        min: 'Please enter a value greater than or equal to {min}',
        max: 'Please enter a value less than or equal to {max}',
        equality: 'This field does not match {field}'
      },
      ...options
    };
    
    this.errors = {};
    this.isSubmitting = false;
    
    this.init();
  }
  
  init() {
    // Prevent native HTML5 validation
    this.form.setAttribute('novalidate', 'true');
    
    // Set up submit event handler
    this.form.addEventListener('submit', (event) => {
      if (!this.validateForm()) {
        event.preventDefault();
        this.showFormErrors();
        this.scrollToFirstError();
        
        // Show toast notification if available
        if (window.Terrafusion && window.Terrafusion.notifications) {
          window.Terrafusion.notifications.warning(
            'Form Validation Error',
            'Please correct the highlighted fields and try again.'
          );
        }
      } else {
        // Form is valid, handle submission state
        this.handleFormSubmission(event);
      }
    });
    
    // Set up live validation events if enabled
    if (this.options.enableLiveValidation) {
      this.setupLiveValidation();
    }
  }
  
  validateForm() {
    this.errors = {};
    const formElements = this.form.elements;
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      
      // Skip buttons, submit inputs, etc.
      if (!this.isValidatableField(element)) {
        continue;
      }
      
      this.validateField(element);
    }
    
    // Return true if no errors
    return Object.keys(this.errors).length === 0;
  }
  
  isValidatableField(element) {
    const type = element.type.toLowerCase();
    
    // These types don't need validation
    const skipTypes = ['submit', 'button', 'reset', 'image', 'file'];
    
    return element.name && 
           !element.disabled && 
           !skipTypes.includes(type) &&
           (!element.getAttribute('data-validate-ignore'));
  }
  
  validateField(element) {
    const name = element.name;
    const value = element.value;
    const type = element.type.toLowerCase();
    
    // Required validation
    if (element.required && !value.trim()) {
      this.addError(name, this.options.validationMessages.required);
      return;
    }
    
    // Skip additional validation if empty and not required
    if (!value.trim()) {
      return;
    }
    
    // Type-specific validation
    switch (type) {
      case 'email':
        this.validateEmail(name, value);
        break;
        
      case 'number':
      case 'range':
        this.validateNumber(name, value, element);
        break;
        
      case 'url':
        this.validateUrl(name, value);
        break;
        
      case 'tel':
        this.validateTel(name, value);
        break;
        
      default:
        this.validateText(name, value, element);
    }
    
    // Custom validation from data attributes
    this.validateCustom(name, value, element);
  }
  
  validateEmail(name, value) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      this.addError(name, this.options.validationMessages.email);
    }
  }
  
  validateNumber(name, value, element) {
    if (isNaN(parseFloat(value))) {
      this.addError(name, this.options.validationMessages.number);
      return;
    }
    
    const min = element.getAttribute('min');
    const max = element.getAttribute('max');
    
    if (min !== null && parseFloat(value) < parseFloat(min)) {
      this.addError(name, this.options.validationMessages.min.replace('{min}', min));
    }
    
    if (max !== null && parseFloat(value) > parseFloat(max)) {
      this.addError(name, this.options.validationMessages.max.replace('{max}', max));
    }
  }
  
  validateUrl(name, value) {
    try {
      new URL(value);
    } catch (e) {
      this.addError(name, 'Please enter a valid URL');
    }
  }
  
  validateTel(name, value) {
    // Basic phone validation - can be customized for different formats
    const phonePattern = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phonePattern.test(value)) {
      this.addError(name, 'Please enter a valid phone number');
    }
  }
  
  validateText(name, value, element) {
    const minlength = element.getAttribute('minlength');
    const maxlength = element.getAttribute('maxlength');
    const pattern = element.getAttribute('pattern');
    
    if (minlength !== null && value.length < parseInt(minlength)) {
      this.addError(name, this.options.validationMessages.minLength.replace('{min}', minlength));
    }
    
    if (maxlength !== null && value.length > parseInt(maxlength)) {
      this.addError(name, this.options.validationMessages.maxLength.replace('{max}', maxlength));
    }
    
    if (pattern !== null) {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        const patternMessage = element.getAttribute('title') || this.options.validationMessages.pattern;
        this.addError(name, patternMessage);
      }
    }
  }
  
  validateCustom(name, value, element) {
    // Check for equality validation (e.g., confirm password)
    const equalTo = element.getAttribute('data-equal-to');
    if (equalTo) {
      const targetElement = document.getElementById(equalTo) || this.form.querySelector(`[name="${equalTo}"]`);
      if (targetElement && value !== targetElement.value) {
        const fieldLabel = targetElement.getAttribute('data-label') || targetElement.name;
        this.addError(name, this.options.validationMessages.equality.replace('{field}', fieldLabel));
      }
    }
    
    // Check for custom JSON validation
    const jsonValidator = element.getAttribute('data-validate-json');
    if (jsonValidator) {
      try {
        JSON.parse(value);
      } catch (e) {
        this.addError(name, 'Please enter valid JSON');
      }
    }
    
    // Check for custom regex validation
    const customRegex = element.getAttribute('data-validate-regex');
    if (customRegex) {
      const regex = new RegExp(customRegex);
      if (!regex.test(value)) {
        const errorMessage = element.getAttribute('data-validate-message') || 'Invalid format';
        this.addError(name, errorMessage);
      }
    }
    
    // Check for custom function validation
    const customFunc = element.getAttribute('data-validate-function');
    if (customFunc && window[customFunc] && typeof window[customFunc] === 'function') {
      const isValid = window[customFunc](value, element);
      if (!isValid) {
        const errorMessage = element.getAttribute('data-validate-message') || 'Validation failed';
        this.addError(name, errorMessage);
      }
    }
  }
  
  addError(name, message) {
    if (!this.errors[name]) {
      this.errors[name] = [];
    }
    this.errors[name].push(message);
  }
  
  showFormErrors() {
    if (!this.options.showInlineErrors) return;
    
    // First, clear any existing error messages
    this.clearErrorMessages();
    
    // Add new error messages
    for (const name in this.errors) {
      const element = this.form.querySelector(`[name="${name}"]`);
      if (!element) continue;
      
      // Add error class to element
      element.classList.add('is-invalid', 'tf-input-error');
      
      // Create error message element
      const errorContainer = document.createElement('div');
      errorContainer.className = 'tf-error-message invalid-feedback';
      errorContainer.setAttribute('data-validation-for', name);
      
      // Add all error messages
      errorContainer.innerHTML = this.errors[name].join('<br>');
      
      // Insert error message after the element or its parent (for radio/checkbox groups)
      const container = element.closest('.tf-form-group') || element.parentNode;
      container.appendChild(errorContainer);
    }
  }
  
  clearErrorMessages() {
    // Remove error classes from all form elements
    const formElements = this.form.elements;
    for (let i = 0; i < formElements.length; i++) {
      formElements[i].classList.remove('is-invalid', 'tf-input-error');
    }
    
    // Remove all error message elements
    const errorMessages = this.form.querySelectorAll('.tf-error-message');
    errorMessages.forEach(element => {
      element.remove();
    });
  }
  
  setupLiveValidation() {
    const formElements = this.form.elements;
    
    // Helper to debounce validation for better performance
    const debounce = (fn, delay) => {
      let timeoutId;
      return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
      };
    };
    
    // Validate input after user stops typing
    const debouncedValidate = debounce((element) => {
      this.errors = {};
      this.validateField(element);
      this.clearFieldError(element);
      
      if (this.errors[element.name]) {
        this.showFieldError(element, this.errors[element.name]);
      }
    }, 300);
    
    for (let i = 0; i < formElements.length; i++) {
      const element = formElements[i];
      
      if (!this.isValidatableField(element)) {
        continue;
      }
      
      element.addEventListener('blur', () => {
        debouncedValidate(element);
      });
      
      element.addEventListener('input', () => {
        // Clear error on input
        this.clearFieldError(element);
      });
    }
  }
  
  clearFieldError(element) {
    // Remove error class
    element.classList.remove('is-invalid', 'tf-input-error');
    
    // Remove error message
    const container = element.closest('.tf-form-group') || element.parentNode;
    const errorMessage = container.querySelector(`[data-validation-for="${element.name}"]`);
    if (errorMessage) {
      errorMessage.remove();
    }
  }
  
  showFieldError(element, errors) {
    // Add error class to element
    element.classList.add('is-invalid', 'tf-input-error');
    
    // Create error message element
    const errorContainer = document.createElement('div');
    errorContainer.className = 'tf-error-message invalid-feedback';
    errorContainer.setAttribute('data-validation-for', element.name);
    
    // Add all error messages
    errorContainer.innerHTML = errors.join('<br>');
    
    // Insert error message after the element or its parent
    const container = element.closest('.tf-form-group') || element.parentNode;
    container.appendChild(errorContainer);
  }
  
  scrollToFirstError() {
    // Find the first element with an error
    for (const name in this.errors) {
      const element = this.form.querySelector(`[name="${name}"]`);
      if (element) {
        // Scroll to the element
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus the element
        setTimeout(() => {
          element.focus();
        }, 500);
        
        break;
      }
    }
  }
  
  handleFormSubmission(event) {
    if (this.isSubmitting) {
      // Prevent duplicate submissions
      event.preventDefault();
      return;
    }
    
    this.isSubmitting = true;
    
    // Check for data-form-message attribute for custom success message
    const successMessage = this.form.getAttribute('data-form-success-message');
    
    // Find submit button and show loading state
    const submitButtons = this.form.querySelectorAll('button[type="submit"], input[type="submit"]');
    const originalButtonTexts = [];
    
    submitButtons.forEach(button => {
      originalButtonTexts.push(button.innerHTML);
      button.disabled = true;
      
      if (button.tagName === 'BUTTON') {
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Submitting...';
      } else {
        button.value = 'Submitting...';
      }
    });
    
    // Handle AJAX form submission if data-ajax attribute is present
    if (this.form.getAttribute('data-ajax') === 'true') {
      event.preventDefault();
      
      const formData = new FormData(this.form);
      const url = this.form.getAttribute('action') || window.location.href;
      const method = this.form.getAttribute('method') || 'POST';
      
      // Convert FormData to JSON if needed
      let body;
      if (this.form.getAttribute('data-ajax-json') === 'true') {
        const data = {};
        formData.forEach((value, key) => {
          data[key] = value;
        });
        body = JSON.stringify(data);
      } else {
        body = formData;
      }
      
      // Send the request
      fetch(url, {
        method: method,
        body: body,
        headers: this.form.getAttribute('data-ajax-json') === 'true' 
          ? { 'Content-Type': 'application/json' } 
          : {},
        credentials: 'same-origin'
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Reset form
        this.form.reset();
        
        // Show success message
        if (successMessage || (data && data.message)) {
          if (window.Terrafusion && window.Terrafusion.notifications) {
            window.Terrafusion.notifications.success(
              data.message || successMessage,
              'Success'
            );
          } else {
            alert(data.message || successMessage);
          }
        }
        
        // Trigger success event
        const event = new CustomEvent('form:success', { detail: data });
        this.form.dispatchEvent(event);
        
        // Redirect if specified
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      })
      .catch(error => {
        console.error('Form submission error:', error);
        
        // Show error message
        if (window.Terrafusion && window.Terrafusion.notifications) {
          window.Terrafusion.notifications.error(
            'There was an error submitting the form. Please try again.',
            'Submission Error'
          );
        } else {
          alert('There was an error submitting the form. Please try again.');
        }
        
        // Trigger error event
        const event = new CustomEvent('form:error', { detail: error });
        this.form.dispatchEvent(event);
      })
      .finally(() => {
        // Reset button state
        submitButtons.forEach((button /* , index */) => {
          button.disabled = false;
          
          if (button.tagName === 'BUTTON') {
            button.innerHTML = originalButtonTexts[index];
          } else {
            button.value = originalButtonTexts[index];
          }
        });
        
        this.isSubmitting = false;
      });
    } else {
      // For regular form submissions, reset submit state after a short delay
      setTimeout(() => {
        this.isSubmitting = false;
        submitButtons.forEach((button /* , index */) => {
          button.disabled = false;
          
          if (button.tagName === 'BUTTON') {
            button.innerHTML = originalButtonTexts[index];
          } else {
            button.value = originalButtonTexts[index];
          }
        });
      }, 2000);
    }
  }
  
  // Public method to manually validate the form
  validate() {
    return this.validateForm();
  }
  
  // Public method to manually show validation errors
  showErrors() {
    this.showFormErrors();
    this.scrollToFirstError();
  }
  
  // Public method to reset the form
  reset() {
    this.form.reset();
    this.clearErrorMessages();
    this.errors = {};
  }
}

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize forms with data-validate attribute
  document.querySelectorAll('form[data-validate="true"]').forEach(form => {
    new TerraFusionFormValidation(`#${form.id}`);
  });
  
  // Export to global namespace
  window.Terrafusion = window.Terrafusion || {};
  window.Terrafusion.FormValidation = TerraFusionFormValidation;
});