const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const storage = require('./storage');
const { initializeFirebase, verifyTokenMiddleware } = require('eco-blog-v2-auth');



const app = express();


app.use(cors());
app.use(bodyParser.json());

if (process.env.NODE_ENV !== 'test') {
  initializeFirebase(process.env.FIREBASE_CONFIG);
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.hostname}${req.url}`);
    }
    next();
  });
}

app.use(verifyTokenMiddleware({ findOrCreateUser: storage.findOrCreateUser.bind(storage) }));

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

app.get('/api/posts/:id', async (req, res) => {
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

app.post('/api/posts', async (req, res) => {
  const { title, text } = req.body;
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const post = await storage.createPost(req.userId, title, text);
    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', async (req, res) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const post = await storage.toggleLikePost(req.params.id, req.userId);
    res.json(post);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const comments = await storage.getComments(req.params.id, req.userId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
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

app.post('/api/posts/:postId/comments/:commentId/like', async (req, res) => {
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

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}