import { HttpException } from './exceptions.js';
import { handleResponse } from '../utils/response.js';

export const catchError = (error, req, res) => {
    if (error instanceof HttpException) {
        // Handle known HTTP exceptions
        return handleResponse(res, error.status, error.message);
    }
    
    // Handle unknown errors
    console.error('Unhandled error:', error);
    return handleResponse(res, 500, 'Internal server error');
}; 