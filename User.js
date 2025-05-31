const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    cart: {
        items: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            }
        }],
        total: {
            type: Number,
            default: 0
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 8);
    }
    next();
});

// Add to cart method
userSchema.methods.addToCart = async function(productId, quantity = 1) {
    const product = await mongoose.model('Product').findById(productId);
    if (!product) throw new Error('Product not found');
    
    const cartItemIndex = this.cart.items.findIndex(item => 
        item.productId.toString() === productId.toString()
    );
    
    let newQuantity = quantity;
    const updatedCartItems = [...this.cart.items];
    
    if (cartItemIndex >= 0) {
        newQuantity = this.cart.items[cartItemIndex].quantity + quantity;
        updatedCartItems[cartItemIndex].quantity = newQuantity;
    } else {
        updatedCartItems.push({ productId, quantity });
    }
    
    const total = this.calculateCartTotal(updatedCartItems, product.price, newQuantity, cartItemIndex >= 0);
    
    this.cart = {
        items: updatedCartItems,
        total
    };
    
    return this.save();
};

// Remove from cart method
userSchema.methods.removeFromCart = async function(productId) {
    const updatedCartItems = this.cart.items.filter(item => 
        item.productId.toString() !== productId.toString()
    );
    
    const products = await mongoose.model('Product').find({
        '_id': { $in: updatedCartItems.map(item => item.productId) }
    });
    
    const total = updatedCartItems.reduce((sum, item) => {
        const product = products.find(p => p._id.toString() === item.productId.toString());
        return sum + (product.price * item.quantity);
    }, 0);
    
    this.cart = {
        items: updatedCartItems,
        total
    };
    
    return this.save();
};

// Update cart quantity method
userSchema.methods.updateCartQuantity = async function(productId, newQuantity) {
    if (newQuantity < 1) throw new Error('Quantity must be at least 1');
    
    const cartItemIndex = this.cart.items.findIndex(item => 
        item.productId.toString() === productId.toString()
    );
    
    if (cartItemIndex < 0) throw new Error('Product not in cart');
    
    const updatedCartItems = [...this.cart.items];
    updatedCartItems[cartItemIndex].quantity = newQuantity;
    
    const products = await mongoose.model('Product').find({
        '_id': { $in: updatedCartItems.map(item => item.productId) }
    });
    
    const total = updatedCartItems.reduce((sum, item) => {
        const product = products.find(p => p._id.toString() === item.productId.toString());
        return sum + (product.price * item.quantity);
    }, 0);
    
    this.cart = {
        items: updatedCartItems,
        total
    };
    
    return this.save();
};

// Calculate cart total helper method
userSchema.methods.calculateCartTotal = function(items, productPrice, newQuantity, isExistingItem) {
    if (isExistingItem) {
        const priceDifference = (newQuantity - items.find(item => item.productId.toString() === productId.toString()).quantity) * productPrice;
        return this.cart.total + priceDifference;
    } else {
        return this.cart.total + (productPrice * newQuantity);
    }
};

// Clear cart method
userSchema.methods.clearCart = function() {
    this.cart = { items: [], total: 0 };
    return this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;