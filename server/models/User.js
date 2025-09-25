import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    hasOrganization:{
        type: Boolean,
        default: false,
    },
    organizationId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        default: null,
    },
    // STRIPE PAYMENT INTEGRATION FIELDS
    // These fields link the user to Stripe's payment system
    stripeCustomerId: {
        type: String, // Stripe customer ID (cus_xxx)
        default: null, // Null until first payment attempt
    },

    // SUBSCRIPTION STATUS TRACKING
    // Mirrors Stripe subscription states for easy querying
    subscriptionStatus: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'inactive', 'trialing'], // Valid Stripe statuses
        default: 'inactive', // Default for new users
    },

    // CURRENT SUBSCRIPTION PLAN
    // Tracks which pricing tier the user is on
    currentPlan: {
        type: String,
        enum: ['basic', 'pro', null], // Available plans + null for no plan
        default: null,
    },

    // TRIAL PERIOD MANAGEMENT
    // Tracks when free trial expires (if applicable)
    trialEndsAt: {
        type: Date, // JavaScript Date object
        default: null, // Null if no trial or trial expired
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Hash password before saving the user
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10); // 10 rounds for salting
        this.password = await bcrypt.hash(this.password, salt); // Hash the password
    }
    next();
});

// Method to compare passwords during login
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};



/**
 * JSON SERIALIZATION METHOD
 *
 * Removes sensitive fields when converting user object to JSON.
 * Prevents password leakage in API responses and logs.
 *
 * @returns {Object} User object without password field
 *
 * Usage:
 * - Automatic in Express.js JSON responses
 * - Manual when logging user objects
 * - Protects against accidental password exposure
 */
UserSchema.methods.toJSON = function () {
  // Convert Mongoose document to plain JavaScript object
  const user = this.toObject();
  // Remove password field from output
  delete user.password;
  return user;
};

export default  mongoose.model('User', UserSchema);

