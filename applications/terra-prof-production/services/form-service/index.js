/**
 * TerraFusionPro Form Service
 * 
 * This service handles form definition, rendering, validation,
 * and processing for property data collection.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Require our adapter instead of the storage module directly
const storagePromise = require('./storage-adapter');

// Initialize express app
const app = express();
const PORT = process.env.FORM_SERVICE_PORT || 5005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Validate form data against a schema
function validateFormData(data, schema) {
  try {
    // Parse schema if it's a string
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
    
    // Simple validation for required fields
    const errors = [];
    if (schemaObj.required && Array.isArray(schemaObj.required)) {
      for (const requiredField of schemaObj.required) {
        if (data[requiredField] === undefined || data[requiredField] === null || data[requiredField] === '') {
          errors.push(`Field "${requiredField}" is required`);
        }
      }
    }
    
    // Validate properties if defined
    if (schemaObj.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(schemaObj.properties)) {
        const value = data[fieldName];
        
        // Skip if value is undefined or null and not required
        if ((value === undefined || value === null) && 
            (!schemaObj.required || !schemaObj.required.includes(fieldName))) {
          continue;
        }
        
        // Type validation
        if (fieldSchema.type && value !== undefined && value !== null) {
          switch (fieldSchema.type) {
            case 'string':
              if (typeof value !== 'string') {
                errors.push(`Field "${fieldName}" must be a string`);
              } else if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                errors.push(`Field "${fieldName}" must be at least ${fieldSchema.minLength} characters long`);
              } else if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                errors.push(`Field "${fieldName}" must be at most ${fieldSchema.maxLength} characters long`);
              } else if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
                errors.push(`Field "${fieldName}" must match the pattern ${fieldSchema.pattern}`);
              }
              break;
            case 'number':
            case 'integer':
              const numValue = Number(value);
              if (isNaN(numValue)) {
                errors.push(`Field "${fieldName}" must be a number`);
              } else if (fieldSchema.type === 'integer' && !Number.isInteger(numValue)) {
                errors.push(`Field "${fieldName}" must be an integer`);
              } else if (fieldSchema.minimum !== undefined && numValue < fieldSchema.minimum) {
                errors.push(`Field "${fieldName}" must be at least ${fieldSchema.minimum}`);
              } else if (fieldSchema.maximum !== undefined && numValue > fieldSchema.maximum) {
                errors.push(`Field "${fieldName}" must be at most ${fieldSchema.maximum}`);
              }
              break;
            case 'boolean':
              if (typeof value !== 'boolean') {
                errors.push(`Field "${fieldName}" must be a boolean`);
              }
              break;
            case 'array':
              if (!Array.isArray(value)) {
                errors.push(`Field "${fieldName}" must be an array`);
              } else if (fieldSchema.minItems && value.length < fieldSchema.minItems) {
                errors.push(`Field "${fieldName}" must have at least ${fieldSchema.minItems} items`);
              } else if (fieldSchema.maxItems && value.length > fieldSchema.maxItems) {
                errors.push(`Field "${fieldName}" must have at most ${fieldSchema.maxItems} items`);
              }
              break;
            case 'object':
              if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                errors.push(`Field "${fieldName}" must be an object`);
              }
              break;
          }
        }
        
        // Enum validation
        if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
          errors.push(`Field "${fieldName}" must be one of: ${fieldSchema.enum.join(', ')}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  } catch (error) {
    console.error('Error validating form data:', error);
    return {
      valid: false,
      errors: ['Invalid schema or validation error']
    };
  }
}

// Calculate completion status of form data
function calculateCompletionStatus(data, schema) {
  try {
    // Parse schema if it's a string
    const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
    
    // If no properties defined, return 0
    if (!schemaObj.properties || Object.keys(schemaObj.properties).length === 0) {
      return 0;
    }
    
    const requiredFields = schemaObj.required || [];
    const totalFields = Object.keys(schemaObj.properties).length;
    let filledFields = 0;
    
    // Count filled fields
    for (const [fieldName, fieldSchema] of Object.entries(schemaObj.properties)) {
      const value = data[fieldName];
      if (value !== undefined && value !== null && value !== '') {
        filledFields++;
      }
    }
    
    // Calculate required fields completion
    let completionRatio = 0;
    if (requiredFields.length > 0) {
      let filledRequiredFields = 0;
      for (const field of requiredFields) {
        const value = data[field];
        if (value !== undefined && value !== null && value !== '') {
          filledRequiredFields++;
        }
      }
      // Required fields are weighted more heavily
      completionRatio = (filledRequiredFields / requiredFields.length) * 0.7;
    }
    
    // Add optional fields completion (weighted less)
    const optionalFieldsCount = totalFields - requiredFields.length;
    if (optionalFieldsCount > 0) {
      const filledOptionalFields = filledFields - Math.min(filledFields, requiredFields.length);
      completionRatio += (filledOptionalFields / optionalFieldsCount) * 0.3;
    } else {
      // If there are only required fields, use the required fields calculation
      completionRatio = filledFields / totalFields;
    }
    
    return Math.min(1, Math.max(0, completionRatio));
  } catch (error) {
    console.error('Error calculating completion status:', error);
    return 0;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'form-service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// GraphQL endpoint for Apollo Federation - minimal implementation
app.post('/graphql', async (req, res) => {
  try {
    // Simple schema for now - will be expanded in later phases
    const response = {
      data: {
        _service: {
          sdl: `
            type Query {
              form(id: ID!): Form
              forms(limit: Int, offset: Int): [Form]
              formSubmission(id: ID!): FormSubmission
              formSubmissions(formId: ID, limit: Int, offset: Int): [FormSubmission]
            }
            
            type Form @key(fields: "id") {
              id: ID!
              name: String!
              description: String
              schema: String!
              type: String!
              isActive: Boolean!
              createdAt: String!
              updatedAt: String
              version: Int!
            }
            
            type FormSubmission @key(fields: "id") {
              id: ID!
              formId: ID!
              reportId: ID
              form: Form
              data: String!
              completionStatus: Float!
              submittedBy: ID!
              submittedAt: String!
              lastUpdated: String
            }
          `
        }
      }
    };
    
    res.json(response);
  } catch (error) {
    console.error('GraphQL error:', error);
    res.status(500).json({ errors: [{ message: error.message }] });
  }
});

// Also handle GET requests for schema introspection
app.get('/graphql', (req, res) => {
  res.json({
    data: {
      _service: {
        sdl: `
          type Query {
            form(id: ID!): Form
            forms(limit: Int, offset: Int): [Form]
            formSubmission(id: ID!): FormSubmission
            formSubmissions(formId: ID, limit: Int, offset: Int): [FormSubmission]
          }
          
          type Form @key(fields: "id") {
            id: ID!
            name: String!
            description: String
            schema: String!
            type: String!
            isActive: Boolean!
            createdAt: String!
            updatedAt: String
            version: Int!
          }
          
          type FormSubmission @key(fields: "id") {
            id: ID!
            formId: ID!
            reportId: ID
            form: Form
            data: String!
            completionStatus: Float!
            submittedBy: ID!
            submittedAt: String!
            lastUpdated: String
          }
        `
      }
    }
  });
});

// Get all forms
app.get('/forms', async (req, res) => {
  try {
    const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;
    
    // Build filter from query params
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';
    
    const forms = await find(
      tables.FORMS, 
      filter, 
      { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        orderBy: `${sortBy} ${order}`
      }
    );
    
    res.json({ forms });
  } catch (error) {
    console.error('Error getting forms:', error);
    res.status(500).json({ error: 'Failed to retrieve forms' });
  }
});

// Get form by ID
app.get('/forms/:id', async (req, res) => {
  try {
    const form = await findById(tables.FORMS, req.params.id);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    res.json({ form });
  } catch (error) {
    console.error('Error getting form by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve form' });
  }
});

// Create form
app.post('/forms', async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      schema,
      uiSchema,
      isActive = true,
      isRequired = false,
      propertyTypes,
      createdBy
    } = req.body;
    
    // Validate required fields
    if (!title || !type || !schema) {
      return res.status(400).json({ error: 'Missing required form fields' });
    }
    
    // Validate schema is valid JSON
    try {
      if (typeof schema === 'string') {
        JSON.parse(schema);
      }
    } catch (error) {
      return res.status(400).json({ error: 'Invalid schema JSON' });
    }
    
    // Convert to snake_case for database
    const formData = {
      title,
      description,
      type,
      schema: typeof schema === 'object' ? JSON.stringify(schema) : schema,
      ui_schema: typeof uiSchema === 'object' ? JSON.stringify(uiSchema) : uiSchema,
      version: 1,
      is_active: isActive,
      is_required: isRequired,
      property_types: propertyTypes ? JSON.stringify(propertyTypes) : null,
      created_by: createdBy,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const form = await create(tables.FORMS, formData);
    
    res.status(201).json({ form });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
app.put('/forms/:id', async (req, res) => {
  try {
    const formId = req.params.id;
    const form = await findById(tables.FORMS, formId);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    const {
      title,
      description,
      type,
      schema,
      uiSchema,
      isActive,
      isRequired,
      propertyTypes
    } = req.body;
    
    // Validate schema is valid JSON if provided
    if (schema) {
      try {
        if (typeof schema === 'string') {
          JSON.parse(schema);
        }
      } catch (error) {
        return res.status(400).json({ error: 'Invalid schema JSON' });
      }
    }
    
    // Convert to snake_case for database
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (schema !== undefined) updateData.schema = typeof schema === 'object' ? JSON.stringify(schema) : schema;
    if (uiSchema !== undefined) updateData.ui_schema = typeof uiSchema === 'object' ? JSON.stringify(uiSchema) : uiSchema;
    if (isActive !== undefined) updateData.is_active = isActive;
    if (isRequired !== undefined) updateData.is_required = isRequired;
    if (propertyTypes !== undefined) updateData.property_types = propertyTypes ? JSON.stringify(propertyTypes) : null;
    
    // Increment version
    updateData.version = form.version + 1;
    
    // Add updated timestamp
    updateData.updated_at = new Date();
    
    const updatedForm = await update(tables.FORMS, formId, updateData);
    
    res.json({ form: updatedForm });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
app.delete('/forms/:id', async (req, res) => {
  try {
    const formId = req.params.id;
    
    // Check if form exists
    const form = await findById(tables.FORMS, formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Check if there are any form submissions using this form
    const submissions = await find(tables.FORM_SUBMISSIONS, { form_id: formId }, { limit: 1 });
    if (submissions.length > 0) {
      // Instead of deleting, just mark as inactive
      await update(tables.FORMS, formId, { 
        is_active: false,
        updated_at: new Date()
      });
      
      return res.json({ 
        success: true, 
        message: 'Form marked as inactive (cannot be deleted due to existing submissions)' 
      });
    }
    
    // Delete the form
    const deleted = await remove(tables.FORMS, formId);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete form' });
    }
    
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Submit form
app.post('/submissions', async (req, res) => {
  try {
    const {
      formId,
      reportId,
      data,
      submittedBy
    } = req.body;
    
    // Validate required fields
    if (!formId || !reportId || !data || !submittedBy) {
      return res.status(400).json({ error: 'Missing required submission fields' });
    }
    
    // Check if form exists
    const form = await findById(tables.FORMS, formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Check if report exists
    const report = await findById(tables.APPRAISAL_REPORTS, reportId);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Validate form data against schema
    const formData = typeof data === 'string' ? JSON.parse(data) : data;
    const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
    const validationResult = validateFormData(formData, formSchema);
    
    // Calculate completion status
    const completionStatus = calculateCompletionStatus(formData, formSchema);
    
    // Convert to snake_case for database
    const submissionData = {
      form_id: formId,
      report_id: reportId,
      data: typeof data === 'object' ? JSON.stringify(data) : data,
      submitted_by: submittedBy,
      submitted_at: new Date(),
      updated_at: new Date(),
      completion_status: completionStatus,
      validation_status: validationResult.valid,
      validation_errors: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
    };
    
    const submission = await create(tables.FORM_SUBMISSIONS, submissionData);
    
    res.status(201).json({ 
      submission,
      completionStatus,
      validationResult
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get form submissions
app.get('/submissions', async (req, res) => {
  try {
    const { limit = 10, offset = 0, sortBy = 'submitted_at', order = 'DESC' } = req.query;
    
    // Build filter from query params
    const filter = {};
    if (req.query.form_id) filter.form_id = parseInt(req.query.form_id);
    if (req.query.report_id) filter.report_id = parseInt(req.query.report_id);
    if (req.query.submitted_by) filter.submitted_by = parseInt(req.query.submitted_by);
    
    const submissions = await find(
      tables.FORM_SUBMISSIONS, 
      filter, 
      { 
        limit: parseInt(limit), 
        offset: parseInt(offset),
        orderBy: `${sortBy} ${order}`
      }
    );
    
    res.json({ submissions });
  } catch (error) {
    console.error('Error getting form submissions:', error);
    res.status(500).json({ error: 'Failed to retrieve form submissions' });
  }
});

// Get form submission by ID
app.get('/submissions/:id', async (req, res) => {
  try {
    const submission = await findById(tables.FORM_SUBMISSIONS, req.params.id);
    
    if (!submission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    const form = await findById(tables.FORMS, submission.form_id);
    
    res.json({ 
      submission,
      form
    });
  } catch (error) {
    console.error('Error getting form submission by ID:', error);
    res.status(500).json({ error: 'Failed to retrieve form submission' });
  }
});

// Update form submission
app.put('/submissions/:id', async (req, res) => {
  try {
    const submissionId = req.params.id;
    const submission = await findById(tables.FORM_SUBMISSIONS, submissionId);
    
    if (!submission) {
      return res.status(404).json({ error: 'Form submission not found' });
    }
    
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    
    // Get form to access schema
    const form = await findById(tables.FORMS, submission.form_id);
    if (!form) {
      return res.status(404).json({ error: 'Associated form not found' });
    }
    
    // Validate form data against schema
    const formData = typeof data === 'string' ? JSON.parse(data) : data;
    const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
    const validationResult = validateFormData(formData, formSchema);
    
    // Calculate completion status
    const completionStatus = calculateCompletionStatus(formData, formSchema);
    
    // Convert to snake_case for database
    const updateData = {
      data: typeof data === 'object' ? JSON.stringify(data) : data,
      updated_at: new Date(),
      completion_status: completionStatus,
      validation_status: validationResult.valid,
      validation_errors: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
    };
    
    const updatedSubmission = await update(tables.FORM_SUBMISSIONS, submissionId, updateData);
    
    res.json({ 
      submission: updatedSubmission,
      completionStatus,
      validationResult
    });
  } catch (error) {
    console.error('Error updating form submission:', error);
    res.status(500).json({ error: 'Failed to update form submission' });
  }
});

// Validate form data without submitting
app.post('/validate', async (req, res) => {
  try {
    const { formId, data } = req.body;
    
    if (!formId || !data) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get form to access schema
    const form = await findById(tables.FORMS, formId);
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    
    // Validate form data against schema
    const formData = typeof data === 'string' ? JSON.parse(data) : data;
    const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
    const validationResult = validateFormData(formData, formSchema);
    
    // Calculate completion status
    const completionStatus = calculateCompletionStatus(formData, formSchema);
    
    res.json({ 
      valid: validationResult.valid,
      errors: validationResult.errors,
      completionStatus
    });
  } catch (error) {
    console.error('Error validating form data:', error);
    res.status(500).json({ error: 'Failed to validate form data' });
  }
});

// Initialize the storage adapter before starting the server
(async function initializeServer() {
  try {
    // Wait for storage adapter to be ready
    const storage = await storagePromise;
    
    // Extract the functions and tables from the storage module
    const { create, find, findById, update, remove, tables } = storage;
    
    // Replace all route handlers with versions that have access to the storage module
    // Handle all routes that use the storage functions
    
    // Get all forms
    app.get('/forms', async (req, res) => {
      try {
        const { limit = 10, offset = 0, sortBy = 'created_at', order = 'DESC' } = req.query;
        
        // Build filter from query params
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.is_active !== undefined) filter.is_active = req.query.is_active === 'true';
        
        const forms = await find(
          tables.FORMS, 
          filter, 
          { 
            limit: parseInt(limit), 
            offset: parseInt(offset),
            orderBy: `${sortBy} ${order}`
          }
        );
        
        res.json({ forms });
      } catch (error) {
        console.error('Error getting forms:', error);
        res.status(500).json({ error: 'Failed to retrieve forms' });
      }
    });
    
    // Get form by ID
    app.get('/forms/:id', async (req, res) => {
      try {
        const form = await findById(tables.FORMS, req.params.id);
        
        if (!form) {
          return res.status(404).json({ error: 'Form not found' });
        }
        
        res.json({ form });
      } catch (error) {
        console.error('Error getting form by ID:', error);
        res.status(500).json({ error: 'Failed to retrieve form' });
      }
    });
    
    // Create form
    app.post('/forms', async (req, res) => {
      try {
        const {
          title,
          description,
          type,
          schema,
          uiSchema,
          isActive = true,
          isRequired = false,
          propertyTypes,
          createdBy
        } = req.body;
        
        // Validate required fields
        if (!title || !type || !schema) {
          return res.status(400).json({ error: 'Missing required form fields' });
        }
        
        // Validate schema is valid JSON
        try {
          if (typeof schema === 'string') {
            JSON.parse(schema);
          }
        } catch (error) {
          return res.status(400).json({ error: 'Invalid schema JSON' });
        }
        
        // Convert to snake_case for database
        const formData = {
          title,
          description,
          type,
          schema: typeof schema === 'object' ? JSON.stringify(schema) : schema,
          ui_schema: typeof uiSchema === 'object' ? JSON.stringify(uiSchema) : uiSchema,
          version: 1,
          is_active: isActive,
          is_required: isRequired,
          property_types: propertyTypes ? JSON.stringify(propertyTypes) : null,
          created_by: createdBy,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        const form = await create(tables.FORMS, formData);
        
        res.status(201).json({ form });
      } catch (error) {
        console.error('Error creating form:', error);
        res.status(500).json({ error: 'Failed to create form' });
      }
    });
    
    // Update form
    app.put('/forms/:id', async (req, res) => {
      try {
        const formId = req.params.id;
        const form = await findById(tables.FORMS, formId);
        
        if (!form) {
          return res.status(404).json({ error: 'Form not found' });
        }
        
        const {
          title,
          description,
          type,
          schema,
          uiSchema,
          isActive,
          isRequired,
          propertyTypes
        } = req.body;
        
        // Validate schema is valid JSON if provided
        if (schema) {
          try {
            if (typeof schema === 'string') {
              JSON.parse(schema);
            }
          } catch (error) {
            return res.status(400).json({ error: 'Invalid schema JSON' });
          }
        }
        
        // Convert to snake_case for database
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (type !== undefined) updateData.type = type;
        if (schema !== undefined) updateData.schema = typeof schema === 'object' ? JSON.stringify(schema) : schema;
        if (uiSchema !== undefined) updateData.ui_schema = typeof uiSchema === 'object' ? JSON.stringify(uiSchema) : uiSchema;
        if (isActive !== undefined) updateData.is_active = isActive;
        if (isRequired !== undefined) updateData.is_required = isRequired;
        if (propertyTypes !== undefined) updateData.property_types = propertyTypes ? JSON.stringify(propertyTypes) : null;
        
        // Increment version
        updateData.version = form.version + 1;
        
        // Add updated timestamp
        updateData.updated_at = new Date();
        
        const updatedForm = await update(tables.FORMS, formId, updateData);
        
        res.json({ form: updatedForm });
      } catch (error) {
        console.error('Error updating form:', error);
        res.status(500).json({ error: 'Failed to update form' });
      }
    });
    
    // Delete form
    app.delete('/forms/:id', async (req, res) => {
      try {
        const formId = req.params.id;
        
        // Check if form exists
        const form = await findById(tables.FORMS, formId);
        if (!form) {
          return res.status(404).json({ error: 'Form not found' });
        }
        
        // Check if there are any form submissions using this form
        const submissions = await find(tables.FORM_SUBMISSIONS, { form_id: formId }, { limit: 1 });
        if (submissions.length > 0) {
          // Instead of deleting, just mark as inactive
          await update(tables.FORMS, formId, { 
            is_active: false,
            updated_at: new Date()
          });
          
          return res.json({ 
            success: true, 
            message: 'Form marked as inactive (cannot be deleted due to existing submissions)' 
          });
        }
        
        // Delete the form
        const deleted = await remove(tables.FORMS, formId);
        
        if (!deleted) {
          return res.status(500).json({ error: 'Failed to delete form' });
        }
        
        res.json({ success: true, message: 'Form deleted successfully' });
      } catch (error) {
        console.error('Error deleting form:', error);
        res.status(500).json({ error: 'Failed to delete form' });
      }
    });
    
    // Submit form
    app.post('/submissions', async (req, res) => {
      try {
        const {
          formId,
          reportId,
          data,
          submittedBy
        } = req.body;
        
        // Validate required fields
        if (!formId || !reportId || !data || !submittedBy) {
          return res.status(400).json({ error: 'Missing required submission fields' });
        }
        
        // Check if form exists
        const form = await findById(tables.FORMS, formId);
        if (!form) {
          return res.status(404).json({ error: 'Form not found' });
        }
        
        // Check if report exists
        const report = await findById(tables.APPRAISAL_REPORTS, reportId);
        if (!report) {
          return res.status(404).json({ error: 'Report not found' });
        }
        
        // Validate form data against schema
        const formData = typeof data === 'string' ? JSON.parse(data) : data;
        const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
        const validationResult = validateFormData(formData, formSchema);
        
        // Calculate completion status
        const completionStatus = calculateCompletionStatus(formData, formSchema);
        
        // Convert to snake_case for database
        const submissionData = {
          form_id: formId,
          report_id: reportId,
          data: typeof data === 'object' ? JSON.stringify(data) : data,
          submitted_by: submittedBy,
          submitted_at: new Date(),
          updated_at: new Date(),
          completion_status: completionStatus,
          validation_status: validationResult.valid,
          validation_errors: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
        };
        
        const submission = await create(tables.FORM_SUBMISSIONS, submissionData);
        
        res.status(201).json({ 
          submission,
          completionStatus,
          validationResult
        });
      } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Failed to submit form' });
      }
    });
    
    // Get form submissions
    app.get('/submissions', async (req, res) => {
      try {
        const { limit = 10, offset = 0, sortBy = 'submitted_at', order = 'DESC' } = req.query;
        
        // Build filter from query params
        const filter = {};
        if (req.query.form_id) filter.form_id = parseInt(req.query.form_id);
        if (req.query.report_id) filter.report_id = parseInt(req.query.report_id);
        if (req.query.submitted_by) filter.submitted_by = parseInt(req.query.submitted_by);
        
        const submissions = await find(
          tables.FORM_SUBMISSIONS, 
          filter, 
          { 
            limit: parseInt(limit), 
            offset: parseInt(offset),
            orderBy: `${sortBy} ${order}`
          }
        );
        
        res.json({ submissions });
      } catch (error) {
        console.error('Error getting form submissions:', error);
        res.status(500).json({ error: 'Failed to retrieve form submissions' });
      }
    });
    
    // Get form submission by ID
    app.get('/submissions/:id', async (req, res) => {
      try {
        const submission = await findById(tables.FORM_SUBMISSIONS, req.params.id);
        
        if (!submission) {
          return res.status(404).json({ error: 'Form submission not found' });
        }
        
        const form = await findById(tables.FORMS, submission.form_id);
        
        res.json({ 
          submission,
          form
        });
      } catch (error) {
        console.error('Error getting form submission by ID:', error);
        res.status(500).json({ error: 'Failed to retrieve form submission' });
      }
    });
    
    // Update form submission
    app.put('/submissions/:id', async (req, res) => {
      try {
        const submissionId = req.params.id;
        const submission = await findById(tables.FORM_SUBMISSIONS, submissionId);
        
        if (!submission) {
          return res.status(404).json({ error: 'Form submission not found' });
        }
        
        const {
          data,
          submittedBy
        } = req.body;
        
        if (!data) {
          return res.status(400).json({ error: 'Missing required data field' });
        }
        
        // Get the form to validate against
        const form = await findById(tables.FORMS, submission.form_id);
        if (!form) {
          return res.status(404).json({ error: 'Associated form not found' });
        }
        
        // Validate form data against schema
        const formData = typeof data === 'string' ? JSON.parse(data) : data;
        const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
        const validationResult = validateFormData(formData, formSchema);
        
        // Calculate completion status
        const completionStatus = calculateCompletionStatus(formData, formSchema);
        
        // Convert to snake_case for database
        const updateData = {
          data: typeof data === 'object' ? JSON.stringify(data) : data,
          updated_at: new Date(),
          completion_status: completionStatus,
          validation_status: validationResult.valid,
          validation_errors: validationResult.errors.length > 0 ? JSON.stringify(validationResult.errors) : null
        };
        
        // If submittedBy is present, update it
        if (submittedBy) {
          updateData.submitted_by = submittedBy;
        }
        
        const updatedSubmission = await update(tables.FORM_SUBMISSIONS, submissionId, updateData);
        
        res.json({ 
          submission: updatedSubmission,
          completionStatus,
          validationResult
        });
      } catch (error) {
        console.error('Error updating form submission:', error);
        res.status(500).json({ error: 'Failed to update form submission' });
      }
    });
    
    // Validate form data
    app.post('/validate', async (req, res) => {
      try {
        const { formId, data } = req.body;
        
        if (!formId || !data) {
          return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Get the form to validate against
        const form = await findById(tables.FORMS, formId);
        if (!form) {
          return res.status(404).json({ error: 'Form not found' });
        }
        
        // Validate form data against schema
        const formData = typeof data === 'string' ? JSON.parse(data) : data;
        const formSchema = typeof form.schema === 'string' ? JSON.parse(form.schema) : form.schema;
        const validationResult = validateFormData(formData, formSchema);
        
        // Calculate completion status
        const completionStatus = calculateCompletionStatus(formData, formSchema);
        
        res.json({
          valid: validationResult.valid,
          errors: validationResult.errors,
          completionStatus
        });
      } catch (error) {
        console.error('Error validating form data:', error);
        res.status(500).json({ error: 'Failed to validate form data' });
      }
    });
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Form service running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error('Failed to initialize Form Service:', error);
    process.exit(1);
  }
})();

module.exports = app;