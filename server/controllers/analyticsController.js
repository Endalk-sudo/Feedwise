import Feedback from "../models/Feedback.js";
import Organization from "../models/Organization.js";

// Basic Analytics Functions
export const getFeedbackList = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ organizationId: org._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("text sentiment category createdAt");

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Feedback.countDocuments({ organizationId: org._id })
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryCount = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const categories = await Feedback.aggregate([
      { $match: { organizationId: org._id } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: categories.map(cat => ({ category: cat._id, count: cat.count }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSentimentSnapshot = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const sentiments = await Feedback.aggregate([
      { $match: { organizationId: org._id } },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);

    const result = {
      Positive: 0,
      Neutral: 0,
      Negative: 0
    };

    sentiments.forEach(s => {
      if (result.hasOwnProperty(s._id)) {
        result[s._id] = s.count;
      }
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Pro Analytics Functions
export const getSentimentTrends = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const { startDate, endDate } = req.query;
    const matchStage = { organizationId: org._id };

    if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) {
          matchStage.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchStage.createdAt.$lte = new Date(endDate);
        }
      }
    

    const trends = await Feedback.find(matchStage).sort({createdAt : 1})

    const formatedData = trends.map((feedback) => ({
      date: feedback.createdAt,
      sentiment: feedback.sentiment,
    }))

    

    res.status(200).json({ success: true, data: formatedData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryBreakdown = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const { startDate, endDate } = req.query;

    // Build the match stage dynamically
    const matchStage = { 
      organizationId: org._id,  
    };

    // Add date filtering if provided
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    const breakdown = await Feedback.find(matchStage);

    const total = breakdown.reduce((acc, {category}) => {
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    },{});

    const result = Object.entries(total).map(([category, count])=>({category,count}))
    console.log(result)
    res.status(200).json({
      success: true,
      data: result
  });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


export const getRecurringIssues = async (req, res) => {
  try {
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const { startDate, endDate } = req.query;

    // Build the match stage dynamically
    const matchStage = { 
      organizationId: org._id, 
      sentiment: "Negative" 
    };

    // Add date filtering if provided
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) {
        matchStage.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.createdAt.$lte = new Date(endDate);
      }
    }

    const issues = await Feedback.aggregate([
      { $match: matchStage },
      { $unwind: "$category" },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: issues.map(issue => ({
        issue: issue._id,
        mentions: issue.count
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};




/**
 * @desc    Get sentiment counts grouped by category for a stacked bar chart
 * @route   GET /api/analytics/sentiment-by-category
 * @access  Private
 */
export const getSentimentByCategory = async (req, res) => {
  try {
    // 1. Authenticate and find the user's organization
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    const { startDate, endDate } = req.query;

    const matchStage = {
          organizationId: org._id,
          // Optional: Ensure sentiment is not null for cleaner data
          sentiment: { $exists: true, $ne: null } 
        }

      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) {
          matchStage.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchStage.createdAt.$lte = new Date(endDate);
        }
      }

    // 2. Aggregate the data
    const sentimentData = await Feedback.aggregate([
      // Stage 1: Filter feedback for the specific organization
      {
        $match: matchStage
      },

      // Stage 2: Group by category and sentiment, and count the occurrences
      {
        $group: {
          _id: {
            category: "$category",
            sentiment: "$sentiment"
          },
          count: { $sum: 1 }
        }
      },

      // Stage 3: Pivot the data to create a flat structure ideal for charts
      {
        $group: {
          _id: "$_id.category",
          // Create fields for each sentiment type and sum the counts
          Positive: {
            $sum: {
              $cond: [{ $eq: ["$_id.sentiment", "Positive"] }, "$count", 0]
            }
          },
          Negative: {
            $sum: {
              $cond: [{ $eq: ["$_id.sentiment", "Negative"] }, "$count", 0]
            }
          },
          Neutral: {
            $sum: {
              $cond: [{ $eq: ["$_id.sentiment", "Neutral"] }, "$count", 0]
            }
          },
          Mixed: {
            $sum: {
              $cond: [{ $eq: ["$_id.sentiment", "Mixed"] }, "$count", 0]
            }
          }
        }
      },

      // Stage 4: Clean up the output format
      {
        $project: {
          _id: 0, // Exclude the default Mongoose _id field
          category: "$_id", // Rename _id to category
          Positive: 1,
          Negative: 1,
          Neutral: 1,
          Mixed: 1
        }
      },

      // Stage 5: Sort the results alphabetically by category name
      {
        $sort: { category: 1 }
      }
    ]);

    // 3. Send the response
    res.status(200).json({ 
      success: true, 
      data: sentimentData 
    });

  } catch (error) {
    console.error("Error in getSentimentByCategory:", error); // Good practice for debugging
    res.status(500).json({ success: false, message: "Server Error" });
  }
};


/**
 * @desc    Get high and medium priority feedback from the last 7 days.
 *         Results are sorted to show the most recent, highest-priority items first.
 * @route   GET /api/analytics/priority-alerts
 * @access  Private
 */
export const getPriorityAlerts = async (req, res) => {
  try {
    // 1. Authenticate and find the user's organization
    const user = req.user;
    const org = await Organization.findOne({ ownerId: user.id });
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    // 2. Calculate the date 7 days ago from now
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 3. Find feedback matching the criteria
    const alerts = await Feedback.find({
      organizationId: org._id,
      urgency: { $in: ["High", "Medium"] }, // Your original great idea
      createdAt: { $gte: sevenDaysAgo } // <-- FIX: Add the 7-day filter
    })
    .sort({ urgency: -1, createdAt: -1 }) // <-- FIX: Sort by priority, then by newest
    .limit(20)
    .select("text urgency category createdAt"); // Your original great idea

    // 4. Send the response
    res.status(200).json({ 
      success: true, 
      data: alerts,
      count: alerts.length // Also send the total count
    });

  } catch (error) {
    console.error("Error in getPriorityAlerts:", error); // Good practice for debugging
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

