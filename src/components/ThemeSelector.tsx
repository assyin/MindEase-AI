import React, { useState, useMemo } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { 
  therapyThemes, 
  themeCategories, 
  getThemesByCategory, 
  searchThemes, 
  TherapyTheme, 
  ThemeCategoryId 
} from '../data/therapyThemes';

interface ThemeSelectorProps {
  onThemeSelect: (theme: TherapyTheme) => void;
  selectedTheme?: TherapyTheme;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ 
  onThemeSelect, 
  selectedTheme 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ThemeCategoryId | null>(null);
  const [viewMode, setViewMode] = useState<'categories' | 'list'>('categories');

  const filteredThemes = useMemo(() => {
    if (searchQuery.trim()) {
      return searchThemes(searchQuery);
    }
    if (selectedCategory) {
      return getThemesByCategory(selectedCategory);
    }
    return therapyThemes;
  }, [searchQuery, selectedCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim()) {
      setViewMode('list');
      setSelectedCategory(null);
    } else {
      setViewMode('categories');
    }
  };

  const handleCategorySelect = (categoryId: ThemeCategoryId) => {
    setSelectedCategory(categoryId);
    setViewMode('list');
    setSearchQuery('');
  };

  const handleBackToCategories = () => {
    setViewMode('categories');
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const selectedCategoryData = selectedCategory 
    ? themeCategories.find(cat => cat.id === selectedCategory)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Sélectionne ton sujet thérapeutique
        </h2>
        <p className="text-gray-600">
          Choisis le thème qui correspond le mieux à ce dont tu souhaites parler
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Rechercher un sujet..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Breadcrumb */}
      {viewMode === 'list' && selectedCategoryData && (
        <div className="flex items-center space-x-2 text-sm">
          <button
            onClick={handleBackToCategories}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Catégories
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600 flex items-center">
            <span className="mr-2">{selectedCategoryData.icon}</span>
            {selectedCategoryData.name}
          </span>
        </div>
      )}

      {/* Categories View */}
      {viewMode === 'categories' && !searchQuery && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Catégories principales</h3>
          <div className="grid gap-4">
            {themeCategories.map(category => {
              const themesInCategory = getThemesByCategory(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all text-left group"
                  style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: category.color + '20' }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {category.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {themesInCategory.length} sujets disponibles
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Themes List */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredThemes.length} résultat{filteredThemes.length !== 1 ? 's' : ''} pour "{searchQuery}"
            </div>
          )}
          
          {filteredThemes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Aucun sujet trouvé
              </h3>
              <p className="text-gray-600">
                Essaie avec d'autres mots-clés ou explore les catégories.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredThemes.map(theme => {
                const category = themeCategories.find(cat => cat.id === theme.category);
                const isSelected = selectedTheme?.id === theme.id;
                
                return (
                  <button
                    key={theme.id}
                    onClick={() => onThemeSelect(theme)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: category?.color + '20' }}
                      >
                        {category?.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {theme.name}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {theme.description}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {theme.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                          {theme.tags.length > 3 && (
                            <span className="inline-block px-2 py-1 text-xs text-gray-500">
                              +{theme.tags.length - 3} autres
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Themes Alphabetical (fallback) */}
      {viewMode === 'categories' && searchQuery && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Résultats de recherche
          </h3>
          <div className="grid gap-3">
            {filteredThemes.map(theme => {
              const category = themeCategories.find(cat => cat.id === theme.category);
              const isSelected = selectedTheme?.id === theme.id;
              
              return (
                <button
                  key={theme.id}
                  onClick={() => onThemeSelect(theme)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: category?.color + '20' }}
                    >
                      {category?.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {theme.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        {theme.description}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <span className="mr-1">{category?.icon}</span>
                          {category?.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};