import mongoose from "mongoose";


const orgSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  logo: {
    type: String,
  },
  content: {
     type: String, 
     required: true,
     unique: true, 
    },
  qrDataUrl: { 
    type: String, 
    required: true 
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Organization = mongoose.model("Organization",orgSchema)


export default Organization;