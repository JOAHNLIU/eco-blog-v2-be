const request = require('supertest');
const app = require('../src/server');
const db = require('../src/models');

describe('Integration Tests for Posts, Likes, and Comments', () => {
  beforeEach(async () => {
    await db.CommentLikes.destroy({ where: {} });
    await db.Comment.destroy({ where: {} });
    await db.Like.destroy({ where: {} });
    await db.Post.destroy({ where: {} });
    await db.User.destroy({ where: { email: 'testuser@example.com' } });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should fetch posts with pagination and sorting', async () => {
    const response = await request(app)
      .get('/api/posts')
      .query({ query: '', sort: 'date', page: 1, limit: 5 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('posts');
    expect(response.body).toHaveProperty('total');
  });

  it('should fetch a single post with details', async () => {
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Detailed Post',
        text: 'This is a detailed post.',
      });

    const postId = postResponse.body.id;

    const response = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', postId);
    expect(response.body).toHaveProperty('title', 'Detailed Post');
  });

  it('should fetch comments for a post', async () => {
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Post with Comments',
        text: 'This post will have comments.',
      });

    const postId = postResponse.body.id;

    const response = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should create a new comment', async () => {
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Comment Test Post',
        text: 'This post is for comment testing.',
      });

    const postId = postResponse.body.id;

    const response = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', 'Bearer valid-token')
      .send({
        text: 'This is a comment.',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('text', 'This is a comment.');
  });

  it('should like a comment', async () => {
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Comment Like Post',
        text: 'This post will have comments liked.',
      });

    const postId = postResponse.body.id;

    const commentResponse = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', 'Bearer valid-token')
      .send({
        text: 'This is a comment to like.',
      });

    const commentId = commentResponse.body.id;

    const likeResponse = await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', 'Bearer valid-token');

    expect(likeResponse.status).toBe(200);
    expect(likeResponse.body).toHaveProperty('likes', 1);
    expect(likeResponse.body).toHaveProperty('isLiked', true);
  });

  it('should unlike a comment', async () => {
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', 'Bearer valid-token')
      .send({
        title: 'Comment Unlike Post',
        text: 'This post will have comments unliked.',
      });

    const postId = postResponse.body.id;

    const commentResponse = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', 'Bearer valid-token')
      .send({
        text: 'This is a comment to unlike.',
      });

    const commentId = commentResponse.body.id;

    await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', 'Bearer valid-token');

    const unlikeResponse = await request(app)
      .post(`/api/posts/${postId}/comments/${commentId}/like`)
      .set('Authorization', 'Bearer valid-token');

    expect(unlikeResponse.status).toBe(200);
    expect(unlikeResponse.body).toHaveProperty('likes', 0);
    expect(unlikeResponse.body).toHaveProperty('isLiked', false);
  });
});