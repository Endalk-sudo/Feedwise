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
    }
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

export default  mongoose.model('User', UserSchema);

