const admin = require('firebase-admin');

if (process.env.FIREBASE_CONFIG) {
  const firebaseConfig = JSON.parse(
    Buffer.from(process.env.FIREBASE_CONFIG, 'base64').toString('utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: firebaseConfig.databaseURL,
  });
} else {
  console.error('FIREBASE_CONFIG is not set in environment variables.');
}

module.exports = admin;