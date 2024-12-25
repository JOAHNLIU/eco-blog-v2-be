const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(
    require('../secrets/serviceAccountKey.json')
  ),
  databaseURL: 'https://eco-blog-dc2dd.firebaseio.com',
});

module.exports = admin;
