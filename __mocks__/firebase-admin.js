jest.mock('firebase-admin', () => {
  const mockAuth = {
    verifyIdToken: jest.fn((token) => {
      if (token === 'valid-token') {
        return Promise.resolve({
          uid: 'test-user-id',
          name: 'Test User',
          email: 'testuser@example.com',
        });
      }
      return Promise.reject(new Error('Invalid token'));
    }),
  };

  return {
    auth: jest.fn(() => mockAuth),
    credential: {
      cert: jest.fn(),
    },
    initializeApp: jest.fn(),
  };
});
