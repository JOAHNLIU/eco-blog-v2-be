const express = require('express');
const bodyParser = require('body-parser');
const verifyToken = require('./authMiddleware');
const cors = require('cors');

const app = express();
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(verifyToken);

let posts = [
  {
    id: 1,
    title: 'First Post',
    text: 'This is the content of the first post.',
    authorId: 'user_1',
    date: new Date().toISOString(),
    likes: 10,
    isLikedBy: ['user_2'],
    commentsCount: 2,
  },
  {
    id: 2,
    title: 'Second Post',
    text: 'This is the content of the second post.',
    authorId: 'user_2',
    date: new Date(Date.now() - 86400000).toISOString(),
    likes: 5,
    isLikedBy: ['user_1', 'user_3'],
    commentsCount: 3,
  },
  {
    id: 3,
    title: 'Third Post',
    text: 'This is another interesting post.',
    authorId: 'user_3',
    date: new Date(Date.now() - 172800000).toISOString(),
    likes: 20,
    isLikedBy: ['user_1'],
    commentsCount: 1,
  },
];

let comments = [
  {
    id: 1,
    postId: 1,
    text: 'Great post!',
    authorId: 'user_2',
    date: new Date(Date.now() - 3600000).toISOString(),
    likes: 3,
    isLikedBy: ['user_3'],
  },
  {
    id: 2,
    postId: 1,
    text: 'Thanks for sharing!',
    authorId: 'user_3',
    date: new Date(Date.now() - 7200000).toISOString(),
    likes: 2,
    isLikedBy: ['user_2'],
  },
  {
    id: 3,
    postId: 2,
    text: 'Interesting thoughts.',
    authorId: 'user_1',
    date: new Date(Date.now() - 5400000).toISOString(),
    likes: 4,
    isLikedBy: ['user_3'],
  },
  {
    id: 4,
    postId: 2,
    text: 'I disagree, but good post!',
    authorId: 'user_3',
    date: new Date(Date.now() - 14400000).toISOString(),
    likes: 1,
    isLikedBy: [],
  },
  {
    id: 5,
    postId: 3,
    text: 'Loved this one!',
    authorId: 'user_2',
    date: new Date(Date.now() - 28800000).toISOString(),
    likes: 5,
    isLikedBy: ['user_1'],
  },
];

app.get('/api/posts', (req, res) => {
  const { query = '', sort = 'date', page = 1, limit = 5 } = req.query;

  let filteredPosts = posts.filter((post) =>
    post.title.toLowerCase().includes(query.toLowerCase())
  );

  if (sort === 'date') {
    filteredPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sort === 'likes') {
    filteredPosts.sort((a, b) => b.likes - a.likes);
  }

  const startIndex = (page - 1) * limit;
  const paginatedPosts = filteredPosts.slice(
    startIndex,
    startIndex + Number(limit)
  );

  const response = paginatedPosts.map((post) => ({
    ...post,
    isLiked: req.userId ? post.isLikedBy.includes(req.userId) : false,
  }));

  res.json({
    posts: response,
    total: filteredPosts.length,
  });
});

app.post('/posts', (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, text } = req.body;
  const newPost = {
    id: Date.now(),
    title,
    text,
    authorId: req.userId,
    likes: 0,
    isLikedBy: [],
    commentsCount: 0,
    date: new Date().toISOString(),
  };

  posts.push(newPost);
  res.status(201).json({
    ...newPost,
    isLiked: false,
  });
});

app.post('/posts/:id/like', (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const post = posts.find((p) => p.id === parseInt(req.params.id, 10));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const isLiked = post.isLikedBy.includes(req.userId);
  if (isLiked) {
    post.likes -= 1;
    post.isLikedBy = post.isLikedBy.filter((id) => id !== req.userId);
  } else {
    post.likes += 1;
    post.isLikedBy.push(req.userId);
  }

  res.json({
    ...post,
    isLiked: !isLiked,
  });
});

app.get('/posts/:id/comments', (req, res) => {
  const postId = parseInt(req.params.id, 10);

  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const postComments = comments.filter((comment) => comment.postId === postId);

  const commentsWithIsLiked = postComments.map((comment) => ({
    ...comment,
    isLiked: req.userId ? comment.isLikedBy.includes(req.userId) : false,
  }));

  res.json(commentsWithIsLiked);
});

app.post('/posts/:id/comments', (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const post = posts.find((p) => p.id === parseInt(req.params.id, 10));
  if (!post) {
    return res.status(404).json({ error: 'Post not found' });
  }

  const { text } = req.body;
  const newComment = {
    id: Date.now(),
    postId: post.id,
    text,
    authorId: req.userId,
    date: new Date().toISOString(),
    likes: 0,
    isLikedBy: [],
  };

  comments.push(newComment);
  post.commentsCount += 1;

  res.status(201).json({
    ...newComment,
    isLiked: false,
  });
});

app.post('/posts/:postId/comments/:commentId/like', (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const comment = comments.find(
    (c) => c.id === parseInt(req.params.commentId, 10)
  );
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  const isLiked = comment.isLikedBy.includes(req.userId);
  if (isLiked) {
    comment.likes -= 1;
    comment.isLikedBy = comment.isLikedBy.filter((id) => id !== req.userId);
  } else {
    comment.likes += 1;
    comment.isLikedBy.push(req.userId);
  }

  res.json({
    ...comment,
    isLiked: !isLiked,
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
