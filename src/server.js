const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const storage = require('./storage');
const verifyToken = require('./authMiddleware');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(verifyToken);

// Routes
app.get('/api/posts', async (req, res) => {
  const { query = '', sort = 'date', page = 1, limit = 5 } = req.query;
  try {
    const { posts, total } = await storage.getPosts(
      query,
      sort,
      page,
      limit,
      req.userId
    );
    res.json({ posts, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/posts/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId;

    const postDetails = await storage.getPostDetails(postId, userId);
    res.json(postDetails);
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: error.message });
  }
});

app.post('/posts', async (req, res) => {
  const { title, text } = req.body;
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const post = await storage.createPost(req.userId, title, text);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/posts/:id/like', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const post = await storage.toggleLikePost(req.params.id, req.userId);
    res.json(post);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await storage.getComments(req.params.id, req.userId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/posts/:id/comments', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const comment = await storage.createComment(
      req.params.id,
      req.userId,
      req.body.text
    );
    res.status(201).json(comment);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/posts/:postId/comments/:commentId/like', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const comment = await storage.toggleLikeComment(
      req.params.commentId,
      req.userId
    );
    res.json(comment);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
