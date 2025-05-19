
import React from 'react';

interface CharacterCounterProps {
  currentCount: number;
  maxCount: number;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  currentCount, 
  maxCount 
}) => {
  const percentage = Math.min(100, Math.round((currentCount / maxCount) * 100));
  
  // Determinar a cor da barra de progresso e texto baseado na porcentagem
  let progressColor = "bg-green-500";
  let textColor = "text-green-700";
  
  if (percentage > 100) {
    progressColor = "bg-red-500";
    textColor = "text-red-700";
  } else if (percentage > 90) {
    progressColor = "bg-yellow-500";
    textColor = "text-yellow-700";
  }

  // Determinar o status de acessibilidade para leitores de tela
  let accessibilityStatus = "Uso de caracteres adequado";
  if (percentage > 100) {
    accessibilityStatus = "Limite de caracteres excedido";
  } else if (percentage > 90) {
    accessibilityStatus = "Aproximando-se do limite de caracteres";
  }

  return (
    <div className="space-y-1" role="status" aria-live="polite">
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>
          <span className={currentCount > maxCount ? "text-red-600 font-medium" : ""}>
            {currentCount}
          </span>
          /{maxCount} caracteres
        </span>
        <span className={percentage > 100 ? "text-red-600 font-semibold" : ""}>
          {percentage}%
        </span>
      </div>
      
      <div 
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-label={accessibilityStatus}
      >
        <div
          className={`h-full ${progressColor} transition-all`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        ></div>
      </div>
      
      <span className="sr-only">{accessibilityStatus}</span>
    </div>
  );
};

export default CharacterCounter;
