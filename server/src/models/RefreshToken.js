
import mongoose from 'mongoose';

/**
 * @typedef {object} RefreshToken
 * @property {mongoose.Schema.Types.ObjectId} user - The ID of the user the token belongs to.
 * @property {string} token - The actual refresh token string.
 * @property {Date} expiresAt - The expiration date and time of the token.
 * @property {Date} createdAt - The creation date and time of the record.
 */

const RefreshTokenSchema = new mongoose.Schema({
  /**
   * Links the refresh token to a specific user.
   * Required for token validation and lookup.
   */
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assumes you have a 'User' model
    required: true,
  },
  
  /**
   * The actual refresh token string issued by the server.
   * It should be unique to prevent issues.
   */
  token: {
    type: String,
    required: true,
    unique: true,
  },
  
  /**
   * The date and time when the refresh token expires.
   * Used for automatic token cleanup and validation.
   */
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  // Adds `createdAt` and `updatedAt` timestamps automatically
  timestamps: true,
});

/**
 * Creates an index on 'expiresAt' with a TTL (Time-To-Live) of 0 seconds.
 * This instructs MongoDB to automatically delete documents 
 * when the 'expiresAt' value is reached, ensuring expired tokens are removed.
 */
RefreshTokenSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema);

export default RefreshToken;
