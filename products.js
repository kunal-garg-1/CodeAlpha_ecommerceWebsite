const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../middleware/upload');

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await Product.find();
        res.render('products/index', { 
            title: 'All Products',
            products,
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading products'
        });
    }
});

// Get single product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                message: 'Product not found'
            });
        }
        
        res.render('products/show', { 
            title: product.name,
            product,
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading product'
        });
    }
});

// Admin routes (protected)
router.use((req, res, next) => {
    if (!req.isAuthenticated || !req.user.isAdmin) {
        return res.status(403).render('error', { 
            title: 'Forbidden',
            message: 'You do not have permission to access this page'
        });
    }
    next();
});

// Create product form
router.get('/create', (req, res) => {
    res.render('products/create', { 
        title: 'Create Product',
        isAuthenticated: req.isAuthenticated
    });
});

// Create product
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, category, stock } = req.body;
        const image = req.file ? `/images/products/${req.file.filename}` : '';
        
        const product = new Product({
            name,
            description,
            price,
            category,
            image,
            stock
        });
        
        await product.save();
        
        res.redirect('/products');
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error creating product'
        });
    }
});

module.exports = router;