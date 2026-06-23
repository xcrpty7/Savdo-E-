const crypto = require('crypto');
const https = require('https');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User.model');
const RefreshToken = require('../models/RefreshToken.model');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const REFRESH_TOKEN_EXPIRES_DAYS = 7;

function exchangeGoogleCode(code) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      grant_type: 'authorization_code',
    }).toString();

    const req = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch { reject(new Error('Failed to parse token response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Register a new user and send email verification code
 */
const register = async ({ name, email, password }, meta = {}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    name,
    email,
    password,
    isEmailVerified: false,
    emailVerificationCode: verificationCode,
    emailVerificationExpires: new Date(Date.now() + 15 * 60 * 1000),
  });

  sendEmail({
    to: user.email,
    subject: 'Savdo-E — Email tasdiqlash',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#1a1a2e;">Email tasdiqlash</h2>
        <p>Salom, <strong>${user.name}</strong>!</p>
        <p>Tasdiqlash kodi: <strong>${verificationCode}</strong></p>
        <p style="color:#888;font-size:13px;">Kod 15 daqiqa ichida amal qiladi.</p>
      </div>
    `,
  }).catch((err) => console.error('Failed to send verification email:', err.message));

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenValue,
    expiresAt,
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Register without email verification (no code)
 */
const registerSimple = async ({ name, email, password }, meta = {}) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'Email already registered');
  }

  const user = await User.create({ name, email, password });

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenValue,
    expiresAt,
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Verify email with 6-digit code
 */
const verifyEmail = async ({ email, code }) => {
  const user = await User.findOne({ email })
    .select('+emailVerificationCode +emailVerificationExpires');

  if (!user) throw new ApiError(400, 'Foydalanuvchi topilmadi');
  if (user.isEmailVerified) throw new ApiError(400, 'Email allaqachon tasdiqlangan');
  if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
    throw new ApiError(400, 'Kod noto\'g\'ri');
  }
  if (user.emailVerificationExpires < new Date()) {
    throw new ApiError(400, 'Kodning muddati o\'tgan');
  }

  user.isEmailVerified = true;
  user.emailVerificationCode = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenValue,
    expiresAt,
    userAgent: '',
    ip: '',
  });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Login user and return tokens
 */
const login = async ({ email, password }, meta = {}) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Your account has been blocked');
  }

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenValue,
    expiresAt,
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Rotate refresh token
 */
const refreshTokens = async (incomingRefreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const storedToken = await RefreshToken.findOneAndUpdate(
    { token: incomingRefreshToken, isRevoked: false },
    { isRevoked: true },
    { new: true }
  );

  if (!storedToken) {
    const alreadyRevoked = await RefreshToken.findOne({ token: incomingRefreshToken });
    if (alreadyRevoked) {
      await RefreshToken.updateMany({ user: alreadyRevoked.user, isRevoked: false }, { isRevoked: true });
    }
    throw new ApiError(401, 'Refresh token not found or already revoked');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await User.findById(decoded.id);
  if (!user || user.isBlocked) {
    throw new ApiError(401, 'User not found or blocked');
  }

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: newRefreshToken,
    expiresAt,
    userAgent: storedToken.userAgent,
    ip: storedToken.ip,
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — revoke specific refresh token
 */
const logout = async (refreshToken) => {
  if (!refreshToken) return;
  await RefreshToken.findOneAndUpdate({ token: refreshToken }, { isRevoked: true });
};

/**
 * Logout all sessions for a user
 */
const logoutAll = async (userId) => {
  await RefreshToken.updateMany({ user: userId, isRevoked: false }, { isRevoked: true });
};

/**
 * Forgot password — generate reset token, send email
 */
const forgotPassword = async (email, resetBaseUrl) => {
  const user = await User.findOne({ email });
  // Always return success to prevent email enumeration
  if (!user) return;

  // Generate raw token (sent to user) and hashed token (stored in DB)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 daqiqa
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${resetBaseUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Savdo-E — Parolni tiklash',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;">
        <h2 style="color:#1a1a2e;">Parolni tiklash</h2>
        <p>Salom, <strong>${user.name}</strong>!</p>
        <p>Parolni tiklash uchun quyidagi tugmani bosing:</p>
        <a href="${resetUrl}"
           style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;
                  border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Parolni tiklash
        </a>
        <p style="color:#888;font-size:13px;">Havola 15 daqiqa ichida amal qiladi.</p>
        <p style="color:#888;font-size:13px;">Agar siz bu so'rovni yubormagan bo'lsangiz, e'tibor bermang.</p>
      </div>
    `,
  });
};

/**
 * Reset password — verify token, update password
 */
const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new ApiError(400, 'Token yaroqsiz yoki muddati tugagan');
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Revoke all sessions after password change
  await RefreshToken.updateMany({ user: user._id, isRevoked: false }, { isRevoked: true });
};

/**
 * Google OAuth — verify ID token or exchange serverAuthCode, find or create user, return JWT tokens
 */
const googleAuth = async (credential, meta = {}) => {
  let payload;

  const verifyWithAudiences = async (token) => {
    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean);
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: audiences.length === 1 ? audiences[0] : audiences,
    });
    return ticket.getPayload();
  };

  // Try as ID token first (JWT) — accepts both Web and Android client audiences
  try {
    payload = await verifyWithAudiences(credential);
  } catch {
    // If ID token verification fails, try exchanging as server auth code
    try {
      const tokens = await exchangeGoogleCode(credential);
      payload = await verifyWithAudiences(tokens.id_token);
    } catch {
      throw new ApiError(401, 'Google token yaroqsiz');
    }
  }

  const { sub: googleId, email, name, picture } = payload;

  // Mavjud user topamiz (googleId yoki email orqali)
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    // Yangi user yaratamiz
    user = await User.create({
      name: name || email.split('@')[0],
      email,
      googleId,
      avatar: picture || null,
      isEmailVerified: true,
    });
  } else {
    // Mavjud userga googleId ulash (email bilan ro'yxatdan o'tgan bo'lsa)
    let changed = false;
    if (!user.googleId) { user.googleId = googleId; changed = true; }
    if (!user.isEmailVerified) { user.isEmailVerified = true; changed = true; }
    if (!user.avatar && picture) { user.avatar = picture; changed = true; }
    if (changed) await user.save({ validateBeforeSave: false });
  }

  if (user.isBlocked) {
    throw new ApiError(403, 'Hisobingiz bloklangan');
  }

  const tokenPayload = { id: user._id, name: user.name, role: user.role };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshTokenValue = generateRefreshToken(tokenPayload);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await RefreshToken.create({
    user: user._id,
    token: refreshTokenValue,
    expiresAt,
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken: refreshTokenValue };
};

/**
 * Google OAuth — exchange authorization code for tokens, then login/register user
 */
const googleCallback = async (code, redirectUri, meta = {}) => {
  const tokenClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri,
  });

  let tokens;
  try {
    const res = await tokenClient.getToken(code);
    tokens = res.tokens;
  } catch {
    throw new ApiError(400, 'Google code almashish xatolik');
  }

  if (!tokens.id_token) {
    throw new ApiError(400, 'Google id_token olinmadi');
  }

  return googleAuth(tokens.id_token, meta);
};

module.exports = { register, login, verifyEmail, refreshTokens, logout, logoutAll, forgotPassword, resetPassword, googleAuth, googleCallback };
