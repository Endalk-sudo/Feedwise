import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SubscriptionPlans from './SubscriptionPlans';

const ReactivateSubscription = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // If user has active subscription, redirect to dashboard
    if (user?.subscriptionStatus === 'active') {
        navigate('/dashboard');
        return null;
    }

    return (
        <div className="reactivate-subscription">
            <div className="reactivate-header">
                <h1>Reactivate Your Subscription</h1>
                <p>Your subscription has expired. Please choose a plan to continue using FeedbackAI.</p>
            </div>
            <SubscriptionPlans />
        </div>
    );
};

export default ReactivateSubscription;