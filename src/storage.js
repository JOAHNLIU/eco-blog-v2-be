const { Op } = require('sequelize');
const { User, Post, Comment, Like, CommentLikes } = require('./models');

class Storage {
  async findOrCreateUser(decodedToken) {
    const [user] = await User.findOrCreate({
      where: { id: decodedToken.uid },
      defaults: {
        name: decodedToken.name || 'Anonymous',
        email: decodedToken.email || null,
        lastLoginAt: new Date(),
      },
    });

    if (user) {
      await user.update({ lastLoginAt: new Date() });
    }
  }

  formatPost(post, userId) {
    return {
      id: post.id,
      title: post.title,
      text: post.text,
      author: post.author?.name || 'Unknown',
      date: post.createdAt.toISOString(),
      likes: post.likesCount || 0,
      isLiked: userId
        ? post.likes.some((like) => like.userId === userId)
        : false,
      commentsCount: post.commentsCount || 0,
    };
  }

  formatComment(comment, userId) {
    return {
      id: comment.id,
      text: comment.text,
      author: comment.author?.name || 'Unknown',
      date: comment.createdAt.toISOString(),
      likes: comment.likesCount || 0,
      isLiked: userId
        ? comment.likes.some((like) => like.userId === userId)
        : false,
    };
  }

  formatPostDetail(post, userId) {
    return {
      id: post.id,
      title: post.title,
      text: post.text,
      author: post.author ? post.author.name : 'Unknown',
      date: post.createdAt.toISOString(),
      likes: post.likesCount || 0,
      isLiked: userId
        ? post.likes.some((like) => like.userId === userId)
        : false,
      commentsCount: post.commentsCount || 0,
      comments: post.comments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        author: comment.author ? comment.author.name : 'Unknown',
        date: comment.createdAt.toISOString(),
        likes: comment.likesCount || 0,
        isLiked: userId
          ? comment.likes.some((like) => like.userId === userId)
          : false,
      })),
    };
  }

  async getPostDetails(postId, userId) {
    const post = await Post.findByPk(postId, {
      include: [
        { model: Like, as: 'likes', attributes: ['userId'] },
        { model: User, as: 'author', attributes: ['name'] },
        {
          model: Comment,
          as: 'comments',
          include: [
            { model: CommentLikes, as: 'likes', attributes: ['userId'] },
            { model: User, as: 'author', attributes: ['name'] },
          ],
        },
      ],
    });

    if (!post) throw new Error('Post not found');

    return this.formatPostDetail(post, userId);
  }

  async createOrUpdateUser(userId, name, email) {
    const [user] = await User.upsert({
      id: userId,
      name,
      email,
      lastLoginAt: new Date(),
    });
    return user;
  }

  async getPosts(query, sort, page, limit, userId) {
    const offset = (page - 1) * limit;
    const where = query
      ? {
          title: {
            [Op.iLike]: `%${query}%`,
          },
        }
      : {};

    const { rows: posts, count: total } = await Post.findAndCountAll({
      where,
      order: [[sort === 'likes' ? 'likesCount' : 'createdAt', 'DESC']],
      limit,
      offset,
      attributes: [
        'id',
        'title',
        'text',
        'createdAt',
        'likesCount',
        'commentsCount',
      ],
      include: [
        {
          model: Like,
          as: 'likes',
          attributes: ['userId'],
        },
        {
          model: User,
          as: 'author',
          attributes: ['name'],
        },
      ],
    });

    return {
      posts: posts.map((post) => this.formatPost(post, userId)),
      total,
    };
  }

  async createPost(authorId, title, text) {
    const post = await Post.create({
      authorId,
      title,
      text,
      likesCount: 0,
      commentsCount: 0,
    });

    const formattedPost = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'author', attributes: ['name'] },
        { model: Like, as: 'likes', attributes: ['userId'] },
      ],
    });

    return this.formatPost(formattedPost, null);
  }

  async toggleLikePost(postId, userId) {
    const post = await Post.findByPk(postId, {
      include: [{ model: Like, as: 'likes', attributes: ['userId'] }],
    });

    if (!post) throw new Error('Post not found');

    const existingLike = await Like.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await existingLike.destroy();
      post.likesCount -= 1;
    } else {
      await Like.create({ postId, userId });
      post.likesCount += 1;
    }

    await post.save();

    const updatedPost = await Post.findByPk(postId, {
      include: [
        { model: Like, as: 'likes', attributes: ['userId'] },
        { model: User, as: 'author', attributes: ['name'] },
      ],
    });

    return this.formatPost(updatedPost, userId);
  }

  async getComments(postId, userId) {
    const comments = await Comment.findAll({
      where: { postId },
      include: [
        {
          model: CommentLikes,
          as: 'likes',
          attributes: ['userId'],
        },
        {
          model: User,
          as: 'author',
          attributes: ['name'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return comments.map((comment) => this.formatComment(comment, userId));
  }

  async createComment(postId, authorId, text) {
    const post = await Post.findByPk(postId);
    if (!post) throw new Error('Post not found');

    const comment = await Comment.create({
      postId,
      authorId,
      text,
      likesCount: 0,
    });

    post.commentsCount += 1;
    await post.save();

    const formattedComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['name'] },
        { model: CommentLikes, as: 'likes', attributes: ['userId'] },
      ],
    });

    return this.formatComment(formattedComment, null);
  }

  async toggleLikeComment(commentId, userId) {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: CommentLikes, as: 'likes', attributes: ['userId'] },
        { model: User, as: 'author', attributes: ['name'] },
      ],
    });

    if (!comment) throw new Error('Comment not found');

    const existingLike = await CommentLikes.findOne({
      where: { commentId, userId },
    });

    if (existingLike) {
      await existingLike.destroy();
      comment.likesCount -= 1;
    } else {
      await CommentLikes.create({ commentId, userId });
      comment.likesCount += 1;
    }

    await comment.save();

    const updatedComment = await Comment.findByPk(commentId, {
      include: [
        { model: CommentLikes, as: 'likes', attributes: ['userId'] },
        { model: User, as: 'author', attributes: ['name'] },
      ],
    });

    return this.formatComment(updatedComment, userId);
  }
}

module.exports = new Storage();
