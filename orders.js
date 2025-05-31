const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

// Protect routes
router.use((req, res, next) => {
    if (!req.isAuthenticated) {
        return res.redirect('/auth/login');
    }
    next();
});

// Get all orders for user
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product');
            
        res.render('orders/index', {
            title: 'My Orders',
            orders,
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading orders'
        });
    }
});

// Checkout page
router.get('/checkout', async (req, res) => {
    try {
        if (req.cart.items.length === 0) {
            return res.redirect('/cart');
        }
        
        // Get product details for cart items
        const productIds = req.cart.items.map(item => item.productId);
        const products = await Product.find({ '_id': { $in: productIds } });
        
        const cartWithProducts = req.cart.items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());
            return {
                ...item.toObject ? item.toObject() : item,
                product
            };
        });
        
        res.render('orders/checkout', {
            title: 'Checkout',
            cart: {
                items: cartWithProducts,
                total: req.cart.total
            },
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading checkout page'
        });
    }
});

// Create order
router.post('/', async (req, res) => {
    try {
        const { paymentMethod, street, city, state, zipCode, country } = req.body;
        
        if (req.cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }
        
        // Get product details for cart items
        const productIds = req.cart.items.map(item => item.productId);
        const products = await Product.find({ '_id': { $in: productIds } });
        
        // Create order items
        const orderItems = req.cart.items.map(item => {
            const product = products.find(p => p._id.toString() === item.productId.toString());
            return {
                product: product._id,
                quantity: item.quantity,
                price: product.price
            };
        });
        
        // Create order
        const order = new Order({
            user: req.user._id,
            items: orderItems,
            total: req.cart.total,
            shippingAddress: {
                street,
                city,
                state,
                zipCode,
                country
            },
            paymentMethod
        });
        
        await order.save();
        
        // Clear cart
        if (req.isAuthenticated) {
            await req.user.clearCart();
        } else {
            res.clearCookie('cart');
        }
        
        res.redirect(`/orders/${order._id}`);
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error creating order'
        });
    }
});

// Get order details
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('items.product');
            
        if (!order) {
            return res.status(404).render('error', { 
                title: 'Not Found',
                message: 'Order not found'
            });
        }
        
        // Check if order belongs to user
        if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).render('error', { 
                title: 'Forbidden',
                message: 'You do not have permission to view this order'
            });
        }
        
        res.render('orders/show', {
            title: `Order #${order._id.toString().substr(-6).toUpperCase()}`,
            order,
            isAuthenticated: req.isAuthenticated,
            cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Error loading order'
        });
    }
});

module.exports = router;