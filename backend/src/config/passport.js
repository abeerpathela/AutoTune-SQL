const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { PrismaClient } = require('@prisma/client');
const { GITHUB_CALLBACK_URL } = require('./env');

const prisma = new PrismaClient();

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({ where: { githubId: profile.id } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              githubId: profile.id,
              email: profile.emails?.[0]?.value || `${profile.username}@github.com`,
              firstName: profile.displayName?.split(' ')[0],
              lastName: profile.displayName?.split(' ')[1],
              avatar: profile.photos?.[0]?.value,
              isVerified: true,
              role: 'USER',
            },
          });
        }

        done(null, user);
      } catch (error) {
        done(error);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
