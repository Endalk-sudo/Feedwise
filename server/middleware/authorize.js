import User from "../models/User.js";

export const requireProPlan = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (user?.currentPlan !== 'pro' || user?.subscriptionStatus !== 'active') {
            return res.status(403).json({ error: 'Pro plan required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const requireSubscription = async (req, res, next) => {
    const userId = req.user.id;
    try {
        const user = await User.findById(userId);
        if (user?.subscriptionStatus !== 'active' || user?.currentPlan === null) {
            return res.status(403).json({ error: 'Subscription required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
