// Cart functionality
document.addEventListener('DOMContentLoaded', function() {
    // Update cart count in navbar
    updateCartCount();
    
    // Add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const productId = this.dataset.id;
            const quantity = this.closest('.product-actions').querySelector('.quantity-input')?.value || 1;
            
            try {
                const response = await fetch('/cart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ productId, quantity }),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    alert('Product added to cart!');
                    updateCartCount(result.cartCount);
                } else {
                    alert(result.message || 'Error adding to cart');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error adding to cart');
            }
        });
    });
    
    // Quantity selectors
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('.quantity-input');
            let value = parseInt(input.value);
            
            if (this.classList.contains('minus') && value > 1) {
                input.value = value - 1;
            } else if (this.classList.contains('plus')) {
                input.value = value + 1;
            }
        });
    });
    
    // Remove item from cart
    document.querySelectorAll('.remove-from-cart').forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            const productId = this.dataset.id;
            
            if (confirm('Are you sure you want to remove this item from your cart?')) {
                try {
                    const response = await fetch(`/cart/${productId}`, {
                        method: 'DELETE',
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        this.closest('.cart-item').remove();
                        updateCartCount(result.cartCount);
                        updateCartTotal(result.total);
                    } else {
                        alert(result.message || 'Error removing item');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error removing item');
                }
            }
        });
    });
    
    // Update cart quantity
    document.querySelectorAll('.cart-quantity').forEach(input => {
        input.addEventListener('change', async function() {
            const productId = this.dataset.id;
            const quantity = this.value;
            
            try {
                const response = await fetch(`/cart/${productId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ quantity }),
                });
                
                const result = await response.json();
                
                if (response.ok) {
                    updateCartTotal(result.total);
                } else {
                    alert(result.message || 'Error updating quantity');
                    this.value = this.dataset.oldValue;
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error updating quantity');
                this.value = this.dataset.oldValue;
            }
        });
        
        // Store old value for reverting if needed
        input.addEventListener('focus', function() {
            this.dataset.oldValue = this.value;
        });
    });
});

function updateCartCount(count) {
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(el => {
        el.textContent = count || 0;
    });
}

function updateCartTotal(total) {
    const totalElement = document.querySelector('.summary-total');
    if (totalElement) {
        totalElement.textContent = `$${total.toFixed(2)}`;
    }
}