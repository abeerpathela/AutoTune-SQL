const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '7d';

const hashPassword = async (password) => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const comparePasswords = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

const generateToken = (userId, role = 'USER') => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

const signup = async (email, password, firstName, lastName) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists with this email');
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });

  const token = generateToken(user.id, user.role);

  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

const login = async (email, password) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const hashedPassword = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          isVerified: true,
        },
      });
    } else if (user.role !== 'ADMIN') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: 'ADMIN' },
      });
    }

    const token = generateToken(user.id, 'ADMIN');
    return {
      token,
      user: { id: user.id, email: user.email, role: 'ADMIN', firstName: user.firstName, lastName: user.lastName, avatar: user.avatar },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  if (!user.password) {
    throw new Error('User signed up via GitHub');
  }

  const passwordMatch = await comparePasswords(password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  const token = generateToken(user.id, user.role);

  return { token, user: { id: user.id, email: user.email, role: user.role } };
};

const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      avatar: true,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  signup,
  login,
  getCurrentUser,
};
