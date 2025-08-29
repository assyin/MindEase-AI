import React from 'react';

interface QuickRepliesProps {
  onSelect: (reply: string) => void;
  context?: string;
}

export const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect, context }) => {
  const getContextualSuggestions = (context?: string) => {
    if (!context) {
      return [
        "Comment vous sentez-vous aujourd'hui ?",
        "J'ai besoin de parler de quelque chose",
        "Je me sens stressé(e) ces temps-ci",
        "J'aimerais des conseils pour me détendre"
      ];
    }

    const contextLower = context.toLowerCase();

    if (contextLower.includes('enfant') || contextLower.includes('école')) {
      return [
        "Ils disent avoir peur d'aller à l'école",
        "Il y a des conflits le matin",
        "Je ne sais plus comment les motiver",
        "Dois-je contacter l'école ?"
      ];
    }

    if (contextLower.includes('stress') || contextLower.includes('anxieux')) {
      return [
        "Quand est-ce que ça a commencé ?",
        "Quels sont les déclencheurs ?",
        "J'aimerais une technique de relaxation",
        "Comment mieux gérer mon stress ?"
      ];
    }

    if (contextLower.includes('triste') || contextLower.includes('déprim')) {
      return [
        "Depuis quand je me sens comme ça ?",
        "Qu'est-ce qui m'aidait avant ?",
        "J'ai besoin de motivation",
        "Comment retrouver l'énergie ?"
      ];
    }

    return [
      "Pouvez-vous m'aider ?",
      "Que me conseillez-vous ?",
      "J'aimerais une technique pratique",
      "Comment faire face à cette situation ?"
    ];
  };

  const suggestions = getContextualSuggestions(context);

  return (
    <div className="mb-2">
      <p className="text-sm text-gray-600 mb-3 font-medium">💡 Suggestions pour continuer :</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors border border-blue-200 hover:border-blue-300"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
