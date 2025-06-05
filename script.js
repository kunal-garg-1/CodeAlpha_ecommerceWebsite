// Simple Cart Functionality
let cart = [];

document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
        const productId = e.target.getAttribute('data-id');
        const productName = e.target.parentElement.querySelector('h3').textContent;
        const productPrice = e.target.parentElement.querySelector('p').textContent;
        
        cart.push({
            id: productId,
            name: productName,
            price: productPrice
        });
        
        updateCartCount();
    });
});

function updateCartCount() {
    document.querySelector('.cart-count').textContent = cart.length;
}