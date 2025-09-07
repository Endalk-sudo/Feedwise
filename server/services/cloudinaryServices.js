import cloudinary from "../config/cloudinary.js";
import multer from 'multer';

// --- Multer Configuration for In-Memory Storage ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


export default upload;