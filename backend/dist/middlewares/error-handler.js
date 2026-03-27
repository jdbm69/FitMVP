"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = notFoundHandler;
exports.errorHandler = errorHandler;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const api_error_1 = require("../types/api-error");
function sendError(res, status, code, message, details) {
    const body = {
        error: {
            code,
            message,
        },
    };
    if (details !== undefined) {
        body.error.details = details;
    }
    res.status(status).json(body);
}
function mapPrismaError(err) {
    if (err.code === "P2002") {
        return new api_error_1.ApiError(409, "UNIQUE_CONSTRAINT_VIOLATION", "Unique constraint violation");
    }
    if (err.code === "P2025") {
        return new api_error_1.ApiError(404, "RECORD_NOT_FOUND", "Requested record was not found");
    }
    // Serialization failures and write conflicts can happen under concurrency.
    if (err.code === "P2034") {
        return new api_error_1.ApiError(409, "WRITE_CONFLICT", "Write conflict detected, please retry");
    }
    return new api_error_1.ApiError(500, "DATABASE_REQUEST_FAILED", "Database request failed");
}
function notFoundHandler(_req, res) {
    sendError(res, 404, "ROUTE_NOT_FOUND", "Route not found");
}
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        sendError(res, 400, "VALIDATION_ERROR", "Validation error", err.issues);
        return;
    }
    if (err instanceof api_error_1.ApiError) {
        sendError(res, err.statusCode, err.code, err.message, err.details);
        return;
    }
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        const mapped = mapPrismaError(err);
        sendError(res, mapped.statusCode, mapped.code, mapped.message, mapped.details);
        return;
    }
    // eslint-disable-next-line no-console
    console.error(err);
    sendError(res, 500, "INTERNAL_SERVER_ERROR", "Internal server error");
}
