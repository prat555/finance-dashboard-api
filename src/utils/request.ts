import { Request } from 'express';

/** Safely extract a single string from req.params (guards against string[]) */
export const param = (req: Request, key: string): string => {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
};

/** Safely extract a single string from req.query */
export const query = (req: Request, key: string): string | undefined => {
  const val = req.query[key];
  if (val === undefined) return undefined;
  return Array.isArray(val) ? (val[0] as string) : (val as string);
};
