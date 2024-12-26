const request = require('supertest');
const app = require('../src/server'); // Ваш Express сервер
const db = require('../src/models'); // Підключення до бази даних

jest.mock('firebase-admin', () => ({
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn((token) => {
      if (token === 'valid-token') {
        return Promise.resolve({ uid: 'test-user-id' });
      } else {
        return Promise.reject(new Error('Invalid token'));
      }
    }),
  })),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));

describe('Integration Tests for Posts and Likes', () => {
  beforeEach(async () => {
    // Очистити базу даних перед кожним тестом
    await db.Like.destroy({ where: {} });
    await db.Post.destroy({ where: {} });
    await db.User.destroy({ where: { email: 'testuser@example.com' } });
  });

  afterAll(async () => {
    // Закриваємо підключення до бази даних після всіх тестів
    await db.sequelize.close();
  });

  it('should create a new post', async () => {
    // Запит на створення посту
    const response = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Integration Test Post',
        text: 'This post is created during an integration test.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Integration Test Post');
    expect(response.body.text).toBe(
      'This post is created during an integration test.'
    );
  });

  it('should like the post', async () => {
    // Створюємо пост
    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Post to Like',
        text: 'This post will be liked.',
      });

    const postId = postResponse.body.id;

    // Лайкаємо пост
    const likeResponse = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', 'Bearer valid-token')
      .send();

    expect(likeResponse.status).toBe(200);
    expect(likeResponse.body).toHaveProperty('likes', 1);
    expect(likeResponse.body).toHaveProperty('isLiked', true);
  });

  it('should dislike the post', async () => {
    // Створюємо пост
    const postResponse = await request(app)
      .post('/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Post to Dislike',
        text: 'This post will be disliked.',
      });

    const postId = postResponse.body.id;

    // Лайкаємо пост
    await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', 'Bearer valid-token')
      .send();

    // Дизлайкаємо пост
    const dislikeResponse = await request(app)
      .post(`/posts/${postId}/like`)
      .set('Authorization', 'Bearer valid-token')
      .send();

    expect(dislikeResponse.status).toBe(200);
    expect(dislikeResponse.body).toHaveProperty('likes', 0);
    expect(dislikeResponse.body).toHaveProperty('isLiked', false);
  });
});
