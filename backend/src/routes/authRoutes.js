const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authService = require('../services/authService');
const { FRONTEND_URL, JWT_SECRET } = require('../config/env');
const { protect } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

function getOAuthRedirectBase() {
  const raw = process.env.FRONTEND_URL || FRONTEND_URL || 'http://localhost:3000';
  const primary = raw.includes(',') ? raw.split(',')[0] : raw;
  return primary.trim().replace(/\/$/, '');
}

router.post('/signup', async (req, res) => {
  try {
    const result = await authService.signup(req.body.email, req.body.password, req.body.firstName, req.body.lastName);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: error.message });
  }
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${getOAuthRedirectBase()}/login` }),
  async (req, res) => {
    const redirectBase = getOAuthRedirectBase();
    try {
      const token = jwt.sign({ userId: req.user.id, role: req.user.role }, JWT_SECRET, {
        expiresIn: '7d',
      });
      res.redirect(`${redirectBase}/auth-success?token=${token}`);
    } catch (error) {
      console.error(error);
      res.redirect(`${redirectBase}/login`);
    }
  }
);

router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
