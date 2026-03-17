// Global Store using Alpine.store
// We'll define this inside an event listener to ensure Alpine is loaded but before it initializes.

document.addEventListener('alpine:init', () => {
    
    // POS Global State Store
    Alpine.store('pos', {
        cart: [],
        
        get totalAmount() {
            return this.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        },

        addToCart(product) {
            const existing = this.cart.find(item => item.product.id === product.id);
            if (existing) {
                existing.quantity += 1;
            } else {
                this.cart.push({ product, quantity: 1 });
            }
        },

        updateCartQuantity(productId, delta) {
            const index = this.cart.findIndex(item => item.product.id === productId);
            if (index !== -1) {
                const item = this.cart[index];
                const newQuantity = item.quantity + delta;
                
                if (newQuantity > 0) {
                    item.quantity = newQuantity;
                } else {
                    // Remove item if quantity falls to 0
                    this.cart.splice(index, 1);
                }
            }
        },

        clearCart() {
            this.cart = [];
        }
    });
});
