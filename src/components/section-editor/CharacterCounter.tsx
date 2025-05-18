
import React from 'react';

interface CharacterCounterProps {
  currentCount: number;
  maxCount: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ currentCount, maxCount }) => {
  const charsPercentage = Math.min(100, Math.round((currentCount / maxCount) * 100));
  
  // Determine the color of the progress bar
  let progressColor = "bg-green-500";
  if (charsPercentage > 90) {
    progressColor = "bg-red-500";
  } else if (charsPercentage > 75) {
    progressColor = "bg-yellow-500";
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          <span className={currentCount > maxCount ? "text-red-600 font-medium" : ""}>
            {currentCount}
          </span>
          /{maxCount} caracteres
        </span>
        <span>{charsPercentage}%</span>
      </div>
      
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${progressColor} transition-all`}
          style={{ width: `${charsPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default CharacterCounter;
