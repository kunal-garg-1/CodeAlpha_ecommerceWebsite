const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

router.get('/', async (req, res) => {
    try {
        const featuredProducts = await Product.find().limit(4).sort({ createdAt: -1 });
        res.render('index', { 
            title: 'Home',
            featuredProducts,
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading featured products'
        });
    }
});

module.exports = router;