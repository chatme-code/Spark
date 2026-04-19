import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import pool from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'spark_fallback_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  kycStatus: string;
}

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = uuidv4() + '-' + uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)`,
    [userId, token, expiresAt]
  );

  return token;
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await pool.query(
    `UPDATE refresh_tokens SET is_revoked = true WHERE token = $1`,
    [token]
  );
};

export const validateRefreshToken = async (token: string): Promise<string | null> => {
  const result = await pool.query(
    `SELECT user_id FROM refresh_tokens 
     WHERE token = $1 AND is_revoked = false AND expires_at > NOW()`,
    [token]
  );

  if (result.rows.length === 0) return null;
  return result.rows[0].user_id;
};
