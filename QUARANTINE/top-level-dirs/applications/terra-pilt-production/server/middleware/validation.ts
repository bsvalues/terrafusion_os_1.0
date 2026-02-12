import { NextFunction, Request, Response } from 'express';
import { z, ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';
import { logger } from '../utils/logger';

export const validateRequest = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationError = fromZodError(error);
                logger.warn('Validation error:', {
                    path: req.path,
                    method: req.method,
                    errors: validationError.details
                });

                return res.status(400).json({
                    error: 'Validation failed',
                    details: validationError.details
                });
            }
            next(error);
        }
    };
};

export const validateParams = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.params);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationError = fromZodError(error);
                logger.warn('Parameter validation error:', {
                    path: req.path,
                    method: req.method,
                    errors: validationError.details
                });

                return res.status(400).json({
                    error: 'Invalid parameters',
                    details: validationError.details
                });
            }
            next(error);
        }
    };
};

export const validateQuery = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.query);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationError = fromZodError(error);
                logger.warn('Query validation error:', {
                    path: req.path,
                    method: req.method,
                    errors: validationError.details
                });

                return res.status(400).json({
                    error: 'Invalid query parameters',
                    details: validationError.details
                });
            }
            next(error);
        }
    };
};

export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
    const sanitizeObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;

        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = value.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    req.body = sanitizeObject(req.body);
    req.query = sanitizeObject(req.query);
    req.params = sanitizeObject(req.params);

    next();
}; 