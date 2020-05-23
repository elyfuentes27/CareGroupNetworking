const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');

const Post = require('../../models/Post');
// const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(), // give an errors away. array() is a method
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); // we don't want to pass the password so we do select('-password)

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });
      const post = await newPost.save();
      res.json(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/posts
// @desc    Get all post
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({
      date: -1,
    }); // get the latest one by sorting and do date -1

    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        msg: 'Post Not Found',
      });
    }
    res.json(post);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      //if is equal to objectId then is not a formated ID/ if is not a valid ID
      return res.status(404).json({
        msg: 'Post Not Found',
      });
    }

    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/posts/:id
// @desc    DELETE a post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if post exist
    if (!post) {
      return res.status(404).json({
        msg: 'Post Not Found',
      });
    }

    //Check user
    if (post.user.toString() !== req.user.id) {
      // post.user is an object and req.user.id is a String. so we convert post.user to a string
      return res.status(401).json({
        msg: 'User not Authorized',
      });
    }

    await post.remove();
    res.json({
      msg: 'Post removed',
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      //if is equal to objectId then is not a formated ID/ if is not a valid ID
      return res.status(404).json({
        msg: 'Post Not Found',
      });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/like/:id
// @desc    Like a post
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      // using the filter to check if current user exist in like.user(convert to string) object. if there is something there then that means it already exist.
      return res.status(400).json({
        msg: 'Post already liked',
      });
    }

    post.likes.unshift({
      user: req.user.id,
    });

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/posts/unlike/:id
// @desc    Unlike a post
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({
        msg: 'Post has not yet been liked',
      });
    }

    //Get remove index
    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id); //Get the correct like to to remove
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/posts/comment/:id
// @desc    Comment on post
// @access  Private
router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(), // give an errors away. array() is a method
      });
    }

    try {
      const user = await User.findById(req.user.id).select('-password'); // we don't want to pass the password so we do select('-password)
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/post/comment/:id/:comment_id
// @desc    Delete comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //Pull out comment, get the comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    ); //true or false if exists

    if (!comment) {
      return res.status(404).json({
        msg: 'Comment does not exist',
      });
    }

    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({
        msg: 'User not Authorized',
      });
    }

    //Get remove index
    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id); //Get the correct like to to remove
    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
