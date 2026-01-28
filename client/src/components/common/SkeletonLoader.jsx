import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'page' }) => {
    if (type === 'auth') {
        return (
            <div className="skeleton-centered">
                <div className="skeleton-spinner"></div>
            </div>
        );
    }

    if (type === 'card') {
        return <div className="skeleton-card"></div>;
    }

    return (
        <div className="skeleton-wrapper">
            <div className="skeleton-header"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-paragraph">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
