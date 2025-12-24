export const FREE_ICONS = [
  { key: 'sun', label: 'Morning', symbol: '☀️' },
  { key: 'book', label: 'Reading', symbol: '📚' },
  { key: 'weight', label: 'Workout', symbol: '🏋️‍♂️' },
  { key: 'laptop', label: 'Focus', symbol: '💻' },
  { key: 'water', label: 'Hydrate', symbol: '💧' },
  { key: 'sleep', label: 'Sleep', symbol: '😴' },
  { key: 'cash', label: 'Cash', symbol: '💵' },
];

export const PREMIUM_ICONS = [
  { key: 'meditation', label: 'Calm', symbol: '🧘' },
  { key: 'fruit', label: 'Eat healthy', symbol: '🍎' },
  { key: 'running', label: 'Run', symbol: '🏃' },
  { key: 'guitar', label: 'Practice', symbol: '🎸' },
  { key: 'language', label: 'Language', symbol: '🌐' },
  { key: 'mind', label: 'Mindfulness', symbol: '🧠' },
  { key: 'study', label: 'Study', symbol: '📖' },
  { key: 'music', label: 'Music', symbol: '🎧' },
  { key: 'create', label: 'Create', symbol: '🎨' },
  { key: 'travel', label: 'Travel', symbol: '✈️' },
  { key: 'tidy', label: 'Tidy', symbol: '🧹' },
  { key: 'stretch', label: 'Stretch', symbol: '🤸' },
  { key: 'budget', label: 'Budget', symbol: '💳' },
];

const ICON_MAP = [...FREE_ICONS, ...PREMIUM_ICONS].reduce((acc, icon) => {
  acc[icon.key] = icon.symbol;
  return acc;
}, {});

export const getIconSymbol = (key) => ICON_MAP[key] || null;
