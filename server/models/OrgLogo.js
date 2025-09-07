import mongoose from "mongoose";

const LogoSchema = new mongoose.Schema({
orgId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
},
url: {
    type: String,
    required: true,
  },
public_id: {
    type: String,
    required: true,
  },
});

const LogoImage = mongoose.model("LogoImage", LogoSchema);

export default LogoImage;