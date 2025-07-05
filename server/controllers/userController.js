
export const getDashboard = (req, res) => {
    // req.user is populated by the auth middleware after verifying the JWT
    res.json({
        msg: `Welcome to the dashboard, ${req.user.id}!`,
        user: req.user 
    });
};


export const getFeedback  = (req, res) => {
    res.json({ msg: 'This is your Feedback data!', user: req.user });
};


export const getAiChat  = (req, res) => {
    res.json({ msg: 'This is AI Chat bot'});
};

