const FEATURE_PLACEHOLDERS = {
  habits: {
    title: 'Habit Tracker',
    description: 'Track habits, completions, and streaks.',
  },
  notes: {
    title: 'Notes',
    description: 'Capture quick notes.',
  },
  todos: {
    title: 'To Do List',
    description: 'Plan tasks, set priorities, and stay focused.',
  },
  pomodoro: {
    title: 'Pomodoro',
    description: 'Pomodoro with customizable focus/break sessions.',
  },
  reading: {
    title: 'Reading List',
    description: 'Keep track of your books.',
  },
  watch: {
    title: 'Movie & Series List',
    description: 'Keep track of your movies and series.',
  },
  journaling: {
    title: 'Journaling',
    description: 'Daily reflections stored securely.',
  },
  sourceDump: {
    title: 'Source Dump',
    description: 'Drop screenshots, links, and copied text for later review.',
  },
  aiHelper: {
    title: 'AI Helper',
    description: 'Context-aware assistant powered by OpenAI.',
  },
};

export const listFeatures = (req, res) => {
  const features = Object.entries(FEATURE_PLACEHOLDERS).map(([key, value]) => ({
    key,
    ...value,
  }));
  res.json({ features });
};

export const getFeaturePlaceholder = (req, res) => {
  const { featureKey } = req.params;
  const data = FEATURE_PLACEHOLDERS[featureKey];
  if (!data) {
    return res.status(404).json({ error: 'Feature not found' });
  }
  return res.json({ feature: { key: featureKey, ...data } });
};
