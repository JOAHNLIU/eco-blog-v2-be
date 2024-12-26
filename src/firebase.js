const admin = require('firebase-admin');

if (process.env.NODE_ENV !== 'test') {
  admin.initializeApp({
    credential: admin.credential.cert(
      require('../secrets/serviceAccountKey.json')
    ),
    databaseURL: 'https://eco-blog-dc2dd.firebaseio.com',
  });
}

module.exports = admin;
