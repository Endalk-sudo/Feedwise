import Feedback from "../models/Feedback.js"
import Organization from "../models/Organization.js"

export const getFeedback = async (req,res) => {
    const {orgSlug} = req.body;

    try {
        const org = await Organization.findOne({slug: orgSlug});
        const allFeedbacks = await Feedback.find({organizationId: org._id});
        if(allFeedbacks.length === 0){
            return res.status(201).json({message: "There is NO feedback"})
        } 
        res.status(202).json(allFeedbacks)

    } catch (error) {
        res.status(404).json({message: error.message})
    }
}


export const submitFeedback = async (req,res) => {
    const { orgSlug } = req.params;
    console.log(orgSlug);
    const {text,rating } = req.body;

    try {
        const org = await Organization.findOne({slug:orgSlug})
        if (!org) return res.status(404).json({ error: 'Organization not found' });

        const feedback = Feedback.create({
            organizationId: org._id,
            text,
            rating
        })

        res.status(201).json({ ok: true, id: feedback._id }) 

    } catch (error) {
        res.status(500).json({message: error.message})
    }
}