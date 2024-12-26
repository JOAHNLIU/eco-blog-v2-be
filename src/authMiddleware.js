const admin = require('./firebase');
const db = require('./models');

async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const isOptional = req.method === 'GET';

  if (!token) {
    if (isOptional) {
      req.userId = null;
      return next();
    }
    return res.status(401).json({ error: 'Token not provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;

    const [user] = await db.User.findOrCreate({
      where: { id: decodedToken.uid },
      defaults: {
        name: decodedToken.name || 'Anonymous',
        email: decodedToken.email || null,
        lastLoginAt: new Date(),
      },
    });

    if (user) {
      await user.update({ lastLoginAt: new Date() });
    }
  } catch (error) {
    console.error('Token verification failed:', error);

    if (!isOptional) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userId = null;
  }

  next();
}

module.exports = verifyToken;
