import { describe, test, expect, jest } from "@jest/globals";
import { 
  ValidationError, 
  NotFoundError, 
  AuthorizationError, 
  ForbiddenError,
  handleZodError,
  asyncHandler,
  errorHandler
} from "../../server/errorHandler";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";

describe("Error Handler Unit Tests", () => {
  test("ValidationError should have correct properties", () => {
    const error = new ValidationError("Invalid input data", [{ field: "email", message: "Invalid email format" }]);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ValidationError");
    expect(error.message).toBe("Invalid input data");
    expect(error.status).toBe(400);
    expect(error.errors).toEqual([{ field: "email", message: "Invalid email format" }]);
  });
  
  test("NotFoundError should have correct properties", () => {
    const error = new NotFoundError("User not found");
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("NotFoundError");
    expect(error.message).toBe("User not found");
    expect(error.status).toBe(404);
  });
  
  test("NotFoundError should use default message if none provided", () => {
    const error = new NotFoundError();
    
    expect(error.message).toBe("Resource not found");
  });
  
  test("AuthorizationError should have correct properties", () => {
    const error = new AuthorizationError("Invalid token");
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AuthorizationError");
    expect(error.message).toBe("Invalid token");
    expect(error.status).toBe(401);
  });
  
  test("ForbiddenError should have correct properties", () => {
    const error = new ForbiddenError("Insufficient permissions");
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ForbiddenError");
    expect(error.message).toBe("Insufficient permissions");
    expect(error.status).toBe(403);
  });
  
  test("handleZodError should format errors correctly", () => {
    // Create a Zod schema
    const schema = z.object({
      username: z.string().min(3),
      email: z.string().email()
    });
    
    // Trigger validation error
    try {
      schema.parse({ username: "a", email: "invalid-email" });
      // This should never execute
      expect(true).toBe(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = handleZodError(error);
        
        expect(validationError).toBeInstanceOf(ValidationError);
        expect(validationError.status).toBe(400);
        expect(validationError.name).toBe("ValidationError");
        expect(validationError.errors.length).toBe(2);
        expect(validationError.errors[0]).toHaveProperty("path");
        expect(validationError.errors[0]).toHaveProperty("message");
      }
    }
  });
  
  test("asyncHandler should handle promise rejections", async () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {} as Response;
    const next = jest.fn();
    
    // Create a function that throws an error
    const errorFunction = async () => {
      throw new Error("Async error");
    };
    
    // Wrap with asyncHandler
    const wrappedFunction = asyncHandler(errorFunction);
    
    // Call the wrapped function
    await wrappedFunction(req, res, next);
    
    // Verify next was called with the error
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe("Async error");
  });
  
  test("errorHandler should handle ValidationError correctly", () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const next = jest.fn();
    
    // Create a validation error
    const error = new ValidationError("Invalid input", [{ field: "email", message: "Invalid email" }]);
    
    // Call error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        type: "ValidationError",
        message: "Invalid input",
        status: 400
      })
    }));
  });
  
  test("errorHandler should handle NotFoundError correctly", () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const next = jest.fn();
    
    // Create a not found error
    const error = new NotFoundError("User not found");
    
    // Call error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        type: "NotFoundError",
        message: "User not found",
        status: 404
      })
    }));
  });
  
  test("errorHandler should handle Zod validation errors", () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const next = jest.fn();
    
    // Create a Zod schema
    const schema = z.object({
      username: z.string().min(3),
      email: z.string().email()
    });
    
    // Trigger validation error and pass to error handler
    try {
      schema.parse({ username: "a", email: "invalid-email" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        errorHandler(error, req, res, next);
        
        // Verify response
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            type: "ValidationError",
            status: 400,
            validationErrors: expect.any(Array)
          })
        }));
      }
    }
  });
  
  test("errorHandler should handle generic errors with 500 status", () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const next = jest.fn();
    
    // Create a generic error
    const error = new Error("Something went wrong");
    
    // Mock console.error to suppress output during test
    console.error = jest.fn();
    
    // Call error handler
    errorHandler(error, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        type: "Error",
        message: "Something went wrong",
        status: 500
      })
    }));
  });
  
  test("errorHandler should handle database errors", () => {
    // Mock request, response, and next function
    const req = {} as Request;
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as unknown as Response;
    const next = jest.fn();
    
    // Create a mock database error
    const dbError = new Error("Duplicate key value violates unique constraint");
    (dbError as any).code = "23505"; // PostgreSQL unique violation code
    
    // Mock console.error to suppress output during test
    console.error = jest.fn();
    
    // Call error handler
    errorHandler(dbError, req, res, next);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      error: expect.objectContaining({
        type: "DatabaseError",
        message: "Database operation failed",
        status: 400
      })
    }));
  });
});