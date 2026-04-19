import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../db';
import { generateAccessToken, generateRefreshToken, validateRefreshToken, revokeRefreshToken } from '../utils/jwt';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/kyc');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
    }
  },
});

// KYC face liveness: lihat lidah, kepala kanan, kepala kiri
const kycUpload = upload.fields([
  { name: 'face_tongue', maxCount: 1 },
  { name: 'face_head_right', maxCount: 1 },
  { name: 'face_head_left', maxCount: 1 },
]);

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('full_name').trim().notEmpty().withMessage('Full name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('date_of_birth').optional().isDate().withMessage('Invalid date of birth'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email, password, full_name, phone, date_of_birth, gender } = req.body;

    try {
      const existing = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      if (existing.rows.length > 0) {
        res.status(409).json({
          success: false,
          message: 'Email is already registered',
        });
        return;
      }

      if (phone) {
        const phoneExisting = await pool.query(
          'SELECT id FROM users WHERE phone = $1',
          [phone]
        );
        if (phoneExisting.rows.length > 0) {
          res.status(409).json({
            success: false,
            message: 'Phone number is already registered',
          });
          return;
        }
      }

      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const userResult = await client.query(
          `INSERT INTO users (email, password_hash, full_name, phone, date_of_birth, gender, kyc_status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')
           RETURNING id, email, full_name, kyc_status, created_at`,
          [email, password_hash, full_name, phone || null, date_of_birth || null, gender || null]
        );

        const user = userResult.rows[0];

        await client.query(
          `INSERT INTO user_profiles (user_id) VALUES ($1)`,
          [user.id]
        );

        await client.query('COMMIT');

        const accessToken = generateAccessToken({
          userId: user.id,
          email: user.email,
          kycStatus: user.kyc_status,
        });
        const refreshToken = await generateRefreshToken(user.id);

        res.status(201).json({
          success: true,
          message: 'Account registered successfully. Please complete face verification (KYC).',
          data: {
            user: {
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              kyc_status: user.kyc_status,
              created_at: user.created_at,
            },
            tokens: {
              access_token: accessToken,
              refresh_token: refreshToken,
              token_type: 'Bearer',
            },
            kyc_instructions: {
              step_1: 'Lihat lidah (show your tongue)',
              step_2: 'Kepala ke kanan (turn head right)',
              step_3: 'Kepala ke kiri (turn head left)',
            },
          },
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/kyc
// Face liveness check — 3 foto wajah: lihat lidah, kepala kanan, kepala kiri
// Multipart form-data fields:
//   face_tongue      (required) — foto saat lihat lidah
//   face_head_right  (required) — foto saat kepala ke kanan
//   face_head_left   (required) — foto saat kepala ke kiri
router.post(
  '/kyc',
  authenticate,
  kycUpload,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const faceTongue = files?.face_tongue?.[0];
    const faceHeadRight = files?.face_head_right?.[0];
    const faceHeadLeft = files?.face_head_left?.[0];

    if (!faceTongue || !faceHeadRight || !faceHeadLeft) {
      const missing: string[] = [];
      if (!faceTongue) missing.push('face_tongue (lihat lidah)');
      if (!faceHeadRight) missing.push('face_head_right (kepala kanan)');
      if (!faceHeadLeft) missing.push('face_head_left (kepala kiri)');

      res.status(400).json({
        success: false,
        message: 'Semua foto wajah wajib diunggah',
        missing_fields: missing,
        instructions: {
          face_tongue: 'Foto wajah sambil memperlihatkan lidah',
          face_head_right: 'Foto wajah dengan kepala menghadap ke kanan',
          face_head_left: 'Foto wajah dengan kepala menghadap ke kiri',
        },
      });
      return;
    }

    try {
      const existingKyc = await pool.query(
        `SELECT id, status FROM kyc_submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );

      if (existingKyc.rows.length > 0 && existingKyc.rows[0].status === 'approved') {
        res.status(409).json({
          success: false,
          message: 'Face verification already approved',
        });
        return;
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.BACKEND_PORT || 3001}`;
      const faceTongueUrl = `${baseUrl}/uploads/kyc/${faceTongue.filename}`;
      const faceHeadRightUrl = `${baseUrl}/uploads/kyc/${faceHeadRight.filename}`;
      const faceHeadLeftUrl = `${baseUrl}/uploads/kyc/${faceHeadLeft.filename}`;

      // Liveness score placeholder (in production, integrate with a face AI API)
      const livenessScore = 85.0 + Math.random() * 15;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const kycResult = await client.query(
          `INSERT INTO kyc_submissions 
           (user_id, face_tongue_url, face_head_right_url, face_head_left_url, liveness_score, status)
           VALUES ($1, $2, $3, $4, $5, 'pending')
           RETURNING id, status, liveness_score, submitted_at`,
          [userId, faceTongueUrl, faceHeadRightUrl, faceHeadLeftUrl, livenessScore.toFixed(2)]
        );

        await client.query(
          `UPDATE users SET kyc_status = 'submitted', updated_at = NOW() WHERE id = $1`,
          [userId]
        );

        await client.query('COMMIT');

        const kyc = kycResult.rows[0];

        res.status(201).json({
          success: true,
          message: 'Verifikasi wajah berhasil dikirim. Sedang dalam proses review.',
          data: {
            kyc_id: kyc.id,
            status: kyc.status,
            liveness_score: parseFloat(kyc.liveness_score),
            submitted_at: kyc.submitted_at,
            photos_received: {
              face_tongue: true,
              face_head_right: true,
              face_head_left: true,
            },
          },
        });
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('KYC face verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Invalid email address'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
      return;
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT id, email, full_name, password_hash, kyc_status, is_active, profile_photo_url
         FROM users WHERE email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const user = result.rows[0];

      if (!user.is_active) {
        res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact support.',
        });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
        return;
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        kycStatus: user.kyc_status,
      });
      const refreshToken = await generateRefreshToken(user.id);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            kyc_status: user.kyc_status,
            profile_photo_url: user.profile_photo_url,
          },
          tokens: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: 'Bearer',
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
    return;
  }

  try {
    const userId = await validateRefreshToken(refresh_token);
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
      return;
    }

    const userResult = await pool.query(
      'SELECT id, email, kyc_status, is_active FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
      res.status(401).json({ success: false, message: 'User not found or inactive' });
      return;
    }

    const user = userResult.rows[0];

    await revokeRefreshToken(refresh_token);

    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      kycStatus: user.kyc_status,
    });
    const newRefreshToken = await generateRefreshToken(user.id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        tokens: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          token_type: 'Bearer',
        },
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  try {
    if (refresh_token) {
      await revokeRefreshToken(refresh_token);
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.date_of_birth, u.gender,
              u.bio, u.profile_photo_url, u.location_city, u.location_country,
              u.kyc_status, u.is_email_verified, u.created_at,
              p.interests, p.photos, p.height_cm, p.education, p.job_title,
              p.company, p.looking_for, p.coins
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: result.rows[0] },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// GET /api/auth/kyc/status - Check KYC face verification status
router.get('/kyc/status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userResult = await pool.query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [req.user!.userId]
    );

    const kycResult = await pool.query(
      `SELECT id, status, liveness_score, rejection_reason, submitted_at, reviewed_at
       FROM kyc_submissions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 1`,
      [req.user!.userId]
    );

    res.status(200).json({
      success: true,
      data: {
        kyc_status: userResult.rows[0]?.kyc_status || 'pending',
        instructions: {
          step_1: 'Lihat lidah (show your tongue)',
          step_2: 'Kepala ke kanan (turn head right)',
          step_3: 'Kepala ke kiri (turn head left)',
        },
        latest_submission: kycResult.rows[0] || null,
      },
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
