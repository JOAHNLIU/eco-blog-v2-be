const mockAuth = {
  verifyIdToken: jest.fn((token) => {
    if (token === 'valid-token') {
      return Promise.resolve({
        uid: 'testuser',
        name: 'Test User',
        email: 'testuser@example.com',
      });
    } else {
      return Promise.reject(new Error('Invalid token'));
    }
  }),
};

const mockFirebaseAdmin = {
  auth: () => mockAuth,
};

module.exports = mockFirebaseAdmin;
