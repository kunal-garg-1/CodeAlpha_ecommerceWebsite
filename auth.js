const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Register page
router.get('/register', (req, res) => {
    if (req.isAuthenticated) {
        return res.redirect('/');
    }
    res.render('auth/register', { 
        title: 'Register',
        isAuthenticated: req.isAuthenticated
    });
});

// Register handler
router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/register', {
            title: 'Register',
            errors: errors.array(),
            isAuthenticated: req.isAuthenticated,
            formData: req.body
        });
    }

    try {
        const { name, email, password } = req.body;
        
        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.render('auth/register', {
                title: 'Register',
                errors: [{ msg: 'User already exists' }],
                isAuthenticated: req.isAuthenticated,
                formData: req.body
            });
        }

        // Create user
        user = new User({ name, email, password });
        await user.save();

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3600000 // 1 hour
        });

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Server error during registration'
        });
    }
});

// Login page
router.get('/login', (req, res) => {
    if (req.isAuthenticated) {
        return res.redirect('/');
    }
    res.render('auth/login', { 
        title: 'Login',
        isAuthenticated: req.isAuthenticated
    });
});

// Login handler
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.render('auth/login', {
            title: 'Login',
            errors: errors.array(),
            isAuthenticated: req.isAuthenticated,
            formData: req.body
        });
    }

    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                errors: [{ msg: 'Invalid credentials' }],
                isAuthenticated: req.isAuthenticated,
                formData: req.body
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.render('auth/login', {
                title: 'Login',
                errors: [{ msg: 'Invalid credentials' }],
                isAuthenticated: req.isAuthenticated,
                formData: req.body
            });
        }

        // Create token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 3600000 // 1 hour
        });

        res.redirect('/');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Server error during login'
        });
    }
});

// Logout handler
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/');
});

module.exports = router;