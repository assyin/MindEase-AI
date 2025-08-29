// Comprehensive therapy themes and categorization system

export interface TherapyTheme {
  id: string;
  name: string;
  description: string;
  category: ThemeCategoryId;
  tags: string[];
  defaultExpertId?: string;
}

export interface ThemeCategory {
  id: ThemeCategoryId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export type ThemeCategoryId = 
  | 'emotional_disorders' 
  | 'relationships_family' 
  | 'personal_development' 
  | 'specialized_issues' 
  | 'daily_life';

export const themeCategories: ThemeCategory[] = [
  {
    id: 'emotional_disorders',
    name: 'Troubles émotionnels',
    icon: '😰',
    color: '#EF4444',
    description: 'Anxiété, dépression, stress, troubles bipolaires...'
  },
  {
    id: 'relationships_family',
    name: 'Relations & Famille',
    icon: '💑',
    color: '#10B981',
    description: 'Relations, famille, communication, éducation...'
  },
  {
    id: 'personal_development',
    name: 'Développement personnel',
    icon: '🌱',
    color: '#F59E0B',
    description: 'Estime de soi, transitions de vie, croissance personnelle...'
  },
  {
    id: 'specialized_issues',
    name: 'Problématiques spécialisées',
    icon: '🏥',
    color: '#8B5CF6',
    description: 'Addictions, troubles alimentaires, traumatismes...'
  },
  {
    id: 'daily_life',
    name: 'Vie quotidienne',
    icon: '💼',
    color: '#3B82F6',
    description: 'Travail, sommeil, douleur chronique, organisation...'
  }
];

export const therapyThemes: TherapyTheme[] = [
  // Troubles émotionnels
  {
    id: 'anxiety',
    name: 'Anxiété',
    description: 'Gestion de l\'anxiété généralisée, crises de panique, phobies',
    category: 'emotional_disorders',
    tags: ['anxiété', 'stress', 'panique', 'phobies', 'tcc'],
    defaultExpertId: 'dr-sarah-anxiety'
  },
  {
    id: 'depression',
    name: 'Dépression',
    description: 'Accompagnement pour la dépression, mélancolie, troubles de l\'humeur',
    category: 'emotional_disorders',
    tags: ['dépression', 'humeur', 'tristesse', 'motivation', 'énergie'],
    defaultExpertId: 'dr-marie-depression'
  },
  {
    id: 'stress',
    name: 'Stress',
    description: 'Techniques de gestion du stress quotidien et professionnel',
    category: 'emotional_disorders',
    tags: ['stress', 'relaxation', 'pression', 'burnout', 'détente'],
    defaultExpertId: 'dr-alex-mindfulness'
  },
  {
    id: 'ocd',
    name: 'TOC',
    description: 'Troubles obsessionnels compulsifs, rituels, pensées intrusives',
    category: 'emotional_disorders',
    tags: ['toc', 'obsessions', 'compulsions', 'rituels', 'contrôle'],
    defaultExpertId: 'dr-julie-ocd'
  },
  {
    id: 'bipolar',
    name: 'Bipolaire',
    description: 'Gestion des troubles bipolaires, stabilisation de l\'humeur',
    category: 'emotional_disorders',
    tags: ['bipolaire', 'manie', 'hypomanie', 'stabilisation', 'humeur'],
    defaultExpertId: 'dr-thomas-bipolar'
  },
  {
    id: 'trauma',
    name: 'Traumatisme',
    description: 'Accompagnement post-traumatique, PTSD, guérison émotionnelle',
    category: 'emotional_disorders',
    tags: ['trauma', 'ptsd', 'choc', 'emdr', 'guérison'],
    defaultExpertId: 'dr-sophie-trauma'
  },

  // Relations et famille
  {
    id: 'relationships',
    name: 'Relations',
    description: 'Relations amoureuses, amicales, conflits relationnels',
    category: 'relationships_family',
    tags: ['relations', 'couple', 'amitié', 'communication', 'conflit'],
    defaultExpertId: 'dr-emma-relationships'
  },
  {
    id: 'self-esteem',
    name: 'Estime de soi',
    description: 'Confiance en soi, image de soi, valeur personnelle',
    category: 'relationships_family',
    tags: ['estime', 'confiance', 'image', 'valeur', 'acceptation'],
    defaultExpertId: 'dr-claire-selfesteem'
  },
  {
    id: 'anger',
    name: 'Colère',
    description: 'Gestion de la colère, agressivité, contrôle émotionnel',
    category: 'relationships_family',
    tags: ['colère', 'agressivité', 'contrôle', 'violence', 'rage'],
    defaultExpertId: 'dr-antoine-anger'
  },
  {
    id: 'grief',
    name: 'Deuil et perte',
    description: 'Accompagnement du deuil, perte d\'un proche, séparation',
    category: 'relationships_family',
    tags: ['deuil', 'perte', 'mort', 'séparation', 'chagrin'],
    defaultExpertId: 'dr-isabelle-grief'
  },
  {
    id: 'attachment',
    name: 'Attachement',
    description: 'Troubles de l\'attachement, dépendance affective',
    category: 'relationships_family',
    tags: ['attachement', 'dépendance', 'abandon', 'sécurité', 'lien'],
    defaultExpertId: 'dr-lucas-attachment'
  },
  {
    id: 'codependency',
    name: 'Codépendance',
    description: 'Relations toxiques, codépendance, limites personnelles',
    category: 'relationships_family',
    tags: ['codépendance', 'toxique', 'limites', 'manipulation', 'contrôle'],
    defaultExpertId: 'dr-nadia-codependency'
  },

  // Développement personnel
  {
    id: 'personal-development',
    name: 'Développement personnel',
    description: 'Croissance personnelle, potentiel, épanouissement',
    category: 'personal_development',
    tags: ['développement', 'croissance', 'potentiel', 'épanouissement', 'réalisation'],
    defaultExpertId: 'dr-paul-development'
  },
  {
    id: 'life-transitions',
    name: 'Transitions de vie',
    description: 'Changements majeurs, adaptation, nouveaux défis',
    category: 'personal_development',
    tags: ['transition', 'changement', 'adaptation', 'nouveau', 'évolution'],
    defaultExpertId: 'dr-camille-transitions'
  },
  {
    id: 'procrastination',
    name: 'Procrastination',
    description: 'Remise à plus tard, motivation, organisation, productivité',
    category: 'personal_development',
    tags: ['procrastination', 'motivation', 'organisation', 'productivité', 'action'],
    defaultExpertId: 'dr-romain-productivity'
  },
  {
    id: 'existential',
    name: 'Existentiel',
    description: 'Sens de la vie, questionnements existentiels, spiritualité',
    category: 'personal_development',
    tags: ['existentiel', 'sens', 'spiritualité', 'questionnement', 'philosophie'],
    defaultExpertId: 'dr-yasmine-existential'
  },

  // Problématiques spécialisées
  {
    id: 'eating-disorders',
    name: 'Troubles de l\'alimentation',
    description: 'Anorexie, boulimie, troubles alimentaires compulsifs',
    category: 'specialized_issues',
    tags: ['alimentation', 'anorexie', 'boulimie', 'compulsif', 'poids'],
    defaultExpertId: 'dr-laure-eating'
  },
  {
    id: 'substance-abuse',
    name: 'Abus de substances',
    description: 'Addictions, dépendances, sevrage, sobriété',
    category: 'specialized_issues',
    tags: ['addiction', 'dépendance', 'sevrage', 'sobriété', 'substance'],
    defaultExpertId: 'dr-david-addiction'
  },
  {
    id: 'sexual-health',
    name: 'Santé sexuelle',
    description: 'Sexualité, intimité, dysfonctions sexuelles',
    category: 'specialized_issues',
    tags: ['sexualité', 'intimité', 'dysfonction', 'libido', 'relation'],
    defaultExpertId: 'dr-florence-sexuality'
  },
  {
    id: 'body-image',
    name: 'Image du corps',
    description: 'Acceptation corporelle, dysmorphie, complexes physiques',
    category: 'specialized_issues',
    tags: ['corps', 'image', 'dysmorphie', 'complexes', 'acceptation'],
    defaultExpertId: 'dr-lea-bodyimage'
  },

  // Vie quotidienne
  {
    id: 'sleep',
    name: 'Sommeil',
    description: 'Troubles du sommeil, insomnie, hygiène du sommeil',
    category: 'daily_life',
    tags: ['sommeil', 'insomnie', 'repos', 'fatigue', 'récupération'],
    defaultExpertId: 'dr-olivier-sleep'
  },
  {
    id: 'chronic-pain',
    name: 'Douleur chronique',
    description: 'Gestion de la douleur chronique, impact psychologique',
    category: 'daily_life',
    tags: ['douleur', 'chronique', 'souffrance', 'gestion', 'adaptation'],
    defaultExpertId: 'dr-mathilde-pain'
  },
  {
    id: 'parenting',
    name: 'Éducation des enfants',
    description: 'Parentalité, éducation, difficultés avec les enfants',
    category: 'daily_life',
    tags: ['parentalité', 'éducation', 'enfants', 'famille', 'autorité'],
    defaultExpertId: 'dr-celine-parenting'
  },
  {
    id: 'childhood',
    name: 'Enfance',
    description: 'Souvenirs d\'enfance, traumatismes infantiles, guérison',
    category: 'daily_life',
    tags: ['enfance', 'souvenirs', 'enfant intérieur', 'passé', 'guérison'],
    defaultExpertId: 'dr-amelie-childhood'
  },
  {
    id: 'work-stress',
    name: 'Gestion du stress au travail',
    description: 'Stress professionnel, burnout, équilibre vie-travail',
    category: 'daily_life',
    tags: ['travail', 'professionnel', 'burnout', 'équilibre', 'carrière'],
    defaultExpertId: 'dr-benjamin-work'
  },
  {
    id: 'family-relationships',
    name: 'Relations familiales',
    description: 'Dynamiques familiales, conflits familiaux, communication',
    category: 'daily_life',
    tags: ['famille', 'parents', 'fratrie', 'générations', 'héritage'],
    defaultExpertId: 'dr-valentine-family'
  },
  {
    id: 'communication',
    name: 'Communication',
    description: 'Compétences de communication, assertivité, expression',
    category: 'daily_life',
    tags: ['communication', 'assertivité', 'expression', 'écoute', 'dialogue'],
    defaultExpertId: 'dr-raphael-communication'
  }
];

// Utility functions
export const getThemesByCategory = (categoryId: ThemeCategoryId): TherapyTheme[] => {
  return therapyThemes.filter(theme => theme.category === categoryId);
};

export const searchThemes = (query: string): TherapyTheme[] => {
  const lowerQuery = query.toLowerCase();
  return therapyThemes.filter(theme =>
    theme.name.toLowerCase().includes(lowerQuery) ||
    theme.description.toLowerCase().includes(lowerQuery) ||
    theme.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

export const getThemeById = (themeId: string): TherapyTheme | undefined => {
  return therapyThemes.find(theme => theme.id === themeId);
};

export const getCategoryById = (categoryId: ThemeCategoryId): ThemeCategory | undefined => {
  return themeCategories.find(category => category.id === categoryId);
};