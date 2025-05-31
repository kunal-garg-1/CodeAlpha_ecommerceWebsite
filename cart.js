const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const User = require('../models/User');

// Get cart
router.get('/', (req, res) => {
    res.render('cart/index', {
        title: 'Shopping Cart',
        cart: req.cart,
        isAuthenticated: req.isAuthenticated,
        cartCount: req.cart.items.reduce((sum, item) => sum + item.quantity, 0)
    });
});

// Add to cart
router.post('/', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (req.isAuthenticated) {
            // User is logged in - save to database
            await req.user.addToCart(productId, parseInt(quantity));
            const user = await User.findById(req.user._id);
            
            return res.json({ 
                message: 'Product added to cart',
                cartCount: user.cart.items.reduce((sum, item) => sum + item.quantity, 0)
            });
        } else {
            // User is not logged in - save to cookie
            let cart = req.cart;
            const existingItemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId.toString()
            );
            
            if (existingItemIndex >= 0) {
                cart.items[existingItemIndex].quantity += parseInt(quantity);
            } else {
                cart.items.push({ productId, quantity: parseInt(quantity) });
            }
            
            cart.total = cart.items.reduce((sum, item) => {
                return sum + (product.price * item.quantity);
            }, 0);
            
            res.cookie('cart', JSON.stringify(cart), {
                maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
            });
            
            return res.json({ 
                message: 'Product added to cart',
                cartCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error adding to cart' });
    }
});

// Update cart item quantity
router.put('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        
        if (quantity < 1) {
            return res.status(400).json({ message: 'Quantity must be at least 1' });
        }
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        if (req.isAuthenticated) {
            // User is logged in - update in database
            await req.user.updateCartQuantity(productId, parseInt(quantity));
            const user = await User.findById(req.user._id);
            
            return res.json({ 
                message: 'Cart updated',
                total: user.cart.total
            });
        } else {
            // User is not logged in - update in cookie
            let cart = req.cart;
            const itemIndex = cart.items.findIndex(item => 
                item.productId.toString() === productId.toString()
            );
            
            if (itemIndex < 0) {
                return res.status(404).json({ message: 'Item not in cart' });
            }
            
            cart.items[itemIndex].quantity = parseInt(quantity);
            cart.total = cart.items.reduce((sum, item) => {
                const itemProduct = item.productId.toString() === productId.toString() ? 
                    product : 
                    req.cart.items.find(i => i.productId.toString() === item.productId.toString())?.productId;
                
                if (!itemProduct) return sum;
                return sum + (itemProduct.price * item.quantity);
            }, 0);
            
            res.cookie('cart', JSON.stringify(cart), {
                maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
            });
            
            return res.json({ 
                message: 'Cart updated',
                total: cart.total
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// Remove from cart
router.delete('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        
        if (req.isAuthenticated) {
            // User is logged in - remove from database
            await req.user.removeFromCart(productId);
            const user = await User.findById(req.user._id);
            
            return res.json({ 
                message: 'Product removed from cart',
                cartCount: user.cart.items.reduce((sum, item) => sum + item.quantity, 0),
                total: user.cart.total
            });
        } else {
            // User is not logged in - remove from cookie
            let cart = req.cart;
            cart.items = cart.items.filter(item => 
                item.productId.toString() !== productId.toString()
            );
            
            const productIds = cart.items.map(item => item.productId);
            const products = await Product.find({ '_id': { $in: productIds } });
            
            cart.total = cart.items.reduce((sum, item) => {
                const product = products.find(p => p._id.toString() === item.productId.toString());
                return sum + (product.price * item.quantity);
            }, 0);
            
            res.cookie('cart', JSON.stringify(cart), {
                maxAge: 7 * 24 * 60 * 60 * 1000 // 1 week
            });
            
            return res.json({ 
                message: 'Product removed from cart',
                cartCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
                total: cart.total
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error removing from cart' });
    }
});

module.exports = router;