const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

// Bring User Model
const User = require('../../models/User');

// @route   Post api/users
// @desc    Register users
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with more than 6 characters'
    ).isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    try {
      // See if User exists
      let user = await User.findOne({
        email
      });

      if (user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'User already exists'
            }
          ]
        });
      }
      // Get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      });

      //create user
      user = new User({
        name,
        email,
        avatar,
        password
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      //save user in the database
      await user.save();

      //create the payload
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
