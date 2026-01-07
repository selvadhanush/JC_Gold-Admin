const Notification = require('../models/Notification');

/**
 * Checks if stock is below threshold and triggers a notification/log
 * @param {Object} inventory - The inventory object
 */
const checkLowStock = async (inventory) => {
    if (inventory.quantity <= inventory.lowStockThreshold) {
        console.log(`[ALERT] Low stock for product ${inventory.product}. Current: ${inventory.quantity}, Threshold: ${inventory.lowStockThreshold}`);
        
        // In a real app, you might send an email or create a notification for SUPER_ADMIN
        // This is a mocked trigger
    }
};

module.exports = checkLowStock;
