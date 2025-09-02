import React from "react";
import "./Rating.css";

const Rating = ({ selectedRating, setSelectedRating }) => {
  const [hoveredRating, setHoveredRating] = React.useState(0);

  const ratings = [
    { emoji: "😠", label: "Terrible", value: 1 },
    { emoji: "😔", label: "Bad", value: 2 },
    { emoji: "😐", label: "Okay", value: 3 },
    { emoji: "😊", label: "Good", value: 4 },
    { emoji: "🤩", label: "Great", value: 5 },
  ];

  const handleRatingClick = (value) => {
    setSelectedRating(value === selectedRating ? 0 : value);
  };

  const handleRatingHover = (value) => {
    setHoveredRating(value);
  };

  const handleMouseLeave = () => {
    setHoveredRating(0);
  };

  return (
    <div className="rating-container">
      <h3>How was your experience today?</h3>
      <div className="rating" onMouseLeave={handleMouseLeave}>
        {ratings.map((rating) => {
          const isSelected = selectedRating === rating.value;
          const isHovered = hoveredRating === rating.value;
          
          return (
            <button
              key={rating.value}
              type="button"
              className={`rating-item ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
              onClick={() => handleRatingClick(rating.value)}
              onMouseEnter={() => handleRatingHover(rating.value)}
              aria-pressed={isSelected}
              aria-label={`Rate ${rating.value} out of 5: ${rating.label}`}
            >
              <span className="emoji">{rating.emoji}</span>
              <p>{rating.label}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Rating;