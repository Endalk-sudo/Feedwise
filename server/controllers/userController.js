import Organization from "../models/Organization.js"
import Feedback from "../models/Feedback.js"


export const getDashboard = async(req, res) => {
    const user = req.user;
    
    try{
        const org = await Organization.findOne({ownerId:user.id});
        if(!org){
            return res.status(404).json({msg:"Organization not found"});
        }

        const feedbacks = await Feedback.find({organizationId:org._id}).sort({createdAt:-1}).limit(5);
        const feedbackNumber = await Feedback.countDocuments({organizationId:org._id});

        res.json({
            org:org,
            feedbacks: feedbacks,
            feedbackNumber: feedbackNumber
        });

    }catch(err){
        console.error(err);
        res.status(500).json({msg:"Server error"});
    }
};


export const getFeedback  = (req, res) => {
    res.json({ msg: 'This is your Feedback data!', user: req.user });
};


