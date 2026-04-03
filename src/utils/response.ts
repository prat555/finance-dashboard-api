import { Response } from 'express';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
) => {
  return res.status(statusCode).json({ success: true, message, data });
};

export const sendCreated = <T>(res: Response, data: T, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

export const sendPaginated = <T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Success',
) => {
  return res.status(200).json({ success: true, message, data, meta });
};
