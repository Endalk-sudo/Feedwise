import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    refreshTokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d', // MongoDB TTL index: auto-removes expired tokens after 7 days
    },
    
});

export default mongoose.model('RefreshToken', RefreshTokenSchema);
