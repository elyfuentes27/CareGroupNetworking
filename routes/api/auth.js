const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// @route   Get api/Auth
// @desc    Test Route
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   Post api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      // See if User exists
      let user = await User.findOne({
        email
      });

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid Credentials'
            }
          ]
        });
      }

      // it has a compare method returns a promise and check if password and encrypt passowrd  match
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: `Invalid Credentials` //is better for security not to say wrong password that way they don't know if user exist or not
            }
          ]
        });
      }

      // payload
      const payload = {
        user: {
          id: user.id
        }
      };

      // sign the payload
      jwt.sign(
        payload, //pass the payload
        config.get('jwtSecret'),
        {
          //pass the secret from the config file
          expiresIn: 36000 // expiration this could be optional
        },
        (err, token) => {
          // inside the callback we could either get error or token
          if (err) throw err;
          res.json({
            token
          });
        }
      );
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error ');
    }
  }
);

module.exports = router;
