import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../types/api-error";

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  const body: ErrorResponse = {
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

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): ApiError {
  if (err.code === "P2002") {
    return new ApiError(409, "UNIQUE_CONSTRAINT_VIOLATION", "Unique constraint violation");
  }

  if (err.code === "P2025") {
    return new ApiError(404, "RECORD_NOT_FOUND", "Requested record was not found");
  }

  // Serialization failures and write conflicts can happen under concurrency.
  if (err.code === "P2034") {
    return new ApiError(409, "WRITE_CONFLICT", "Write conflict detected, please retry");
  }

  return new ApiError(500, "DATABASE_REQUEST_FAILED", "Database request failed");
}

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, "ROUTE_NOT_FOUND", "Route not found");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    sendError(res, 400, "VALIDATION_ERROR", "Validation error", err.issues);
    return;
  }

  if (err instanceof ApiError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    sendError(res, mapped.statusCode, mapped.code, mapped.message, mapped.details);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(err);
  sendError(res, 500, "INTERNAL_SERVER_ERROR", "Internal server error");
}
