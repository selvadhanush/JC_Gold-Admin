const mongoose = require('mongoose');

const maintenanceModeSchema = new mongoose.Schema({
    isActive: {
        type: Boolean,
        default: false,
        required: true
    },
    isScheduled: {
        type: Boolean,
        default: false,
        required: true
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    startsAt: {
        type: Date,
        default: null
    },
    activatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    delayMinutes: {
        type: Number,
        default: 0
    },
    message: {
        type: String,
        default: 'System is currently under maintenance. We\'ll be back soon!'
    },
    expectedDuration: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Ensure only one maintenance mode document exists
maintenanceModeSchema.statics.getInstance = async function () {
    let instance = await this.findOne();
    if (!instance) {
        instance = await this.create({
            isActive: false,
            isScheduled: false
        });
    }
    return instance;
};

module.exports = mongoose.model('MaintenanceMode', maintenanceModeSchema);
