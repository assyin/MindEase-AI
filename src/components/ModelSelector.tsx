import React from 'react';

interface ModelSelectorProps {
  selected: 'auto' | 'gemini' | 'openai';
  onSelect: (model: 'auto' | 'gemini' | 'openai') => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ selected, onSelect }) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">IA:</span>
      <select
        value={selected}
        onChange={(e) => onSelect(e.target.value as 'auto' | 'gemini' | 'openai')}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="auto">🔄 Auto</option>
        <option value="gemini">🟢 Gemini</option>
        <option value="openai">🟠 OpenAI</option>
      </select>
    </div>
  );
};
