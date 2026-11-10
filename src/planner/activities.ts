/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner activities
 *
 * The routine activities in the planner library, each drawn with a picture from the
 * picture library (Just My Planner's starter blocks, moved onto our own art).
 * Pictures not drawn yet (face, pencil, tv, pyjamas, friends) print as the template-grid
 * placeholder with their name, so they're easy to spot and redraw.
 */

export type ActivityGroup = 'morning' | 'learning' | 'meals' | 'play' | 'winddown';

export interface PlannerActivity {
  id: string;
  label: string;
  picture: string;
  group: ActivityGroup;
  /** Usual length in minutes (30-minute steps) */
  minutes: number;
}

export const ACTIVITY_GROUPS: { id: ActivityGroup; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'learning', label: 'School and learning' },
  { id: 'meals', label: 'Meals and snacks' },
  { id: 'play', label: 'Play and outside' },
  { id: 'winddown', label: 'Wind down' },
];

export const ACTIVITIES: PlannerActivity[] = [
  { id: 'wake-up', label: 'Wake up', picture: 'sun', group: 'morning', minutes: 30 },
  { id: 'brush-teeth', label: 'Brush teeth', picture: 'toothbrush', group: 'morning', minutes: 30 },
  { id: 'wash-face', label: 'Wash face', picture: 'soap', group: 'morning', minutes: 30 },
  { id: 'get-dressed', label: 'Get dressed', picture: 'shirt', group: 'morning', minutes: 30 },
  { id: 'make-bed', label: 'Make bed', picture: 'quilt', group: 'morning', minutes: 30 },
  { id: 'breakfast', label: 'Breakfast', picture: 'bowl', group: 'morning', minutes: 30 },
  { id: 'pack-bag', label: 'Pack backpack', picture: 'backpack', group: 'morning', minutes: 30 },
  { id: 'shoes-on', label: 'Shoes on', picture: 'shoes', group: 'morning', minutes: 30 },

  { id: 'school', label: 'School time', picture: 'bus', group: 'learning', minutes: 180 },
  { id: 'reading', label: 'Reading books', picture: 'book', group: 'learning', minutes: 30 },
  { id: 'homework', label: 'Homework', picture: 'pencil', group: 'learning', minutes: 30 },
  { id: 'music', label: 'Music practice', picture: 'guitar', group: 'learning', minutes: 30 },
  { id: 'art', label: 'Art and crafts', picture: 'paintbrush', group: 'learning', minutes: 60 },
  { id: 'circle-time', label: 'Circle time', picture: 'friends', group: 'learning', minutes: 30 },
  { id: 'puzzles', label: 'Puzzles', picture: 'puzzle', group: 'learning', minutes: 30 },

  { id: 'snack', label: 'Snack', picture: 'apple', group: 'meals', minutes: 30 },
  { id: 'lunch', label: 'Lunch', picture: 'sandwich', group: 'meals', minutes: 30 },
  { id: 'treat', label: 'Treat', picture: 'cookie', group: 'meals', minutes: 30 },
  { id: 'dinner', label: 'Dinner', picture: 'dish', group: 'meals', minutes: 60 },
  { id: 'water', label: 'Drink water', picture: 'cup', group: 'meals', minutes: 30 },
  { id: 'milk', label: 'Milk', picture: 'milk', group: 'meals', minutes: 30 },

  { id: 'outside', label: 'Outside play', picture: 'tree', group: 'play', minutes: 60 },
  { id: 'playground', label: 'Playground', picture: 'swing', group: 'play', minutes: 60 },
  { id: 'free-play', label: 'Free play', picture: 'teddy-bear', group: 'play', minutes: 60 },
  { id: 'ball', label: 'Sports', picture: 'ball', group: 'play', minutes: 60 },
  { id: 'bike', label: 'Bike ride', picture: 'bike', group: 'play', minutes: 60 },
  { id: 'swimming', label: 'Swimming', picture: 'swimsuit', group: 'play', minutes: 60 },
  { id: 'pets', label: 'Care for pets', picture: 'dog', group: 'play', minutes: 30 },
  { id: 'screen', label: 'Screen time', picture: 'tv', group: 'play', minutes: 30 },
  { id: 'tidy', label: 'Tidy up toys', picture: 'box', group: 'play', minutes: 30 },

  { id: 'nap', label: 'Nap', picture: 'moon', group: 'winddown', minutes: 60 },
  { id: 'bath', label: 'Bath time', picture: 'bathtub', group: 'winddown', minutes: 30 },
  { id: 'pyjamas', label: 'Pyjamas on', picture: 'pyjamas', group: 'winddown', minutes: 30 },
  { id: 'story', label: 'Story time', picture: 'book', group: 'winddown', minutes: 30 },
  { id: 'teeth-night', label: 'Brush teeth', picture: 'toothbrush', group: 'winddown', minutes: 30 },
  { id: 'bedtime', label: 'Bedtime', picture: 'bed', group: 'winddown', minutes: 30 },
];

export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);

/** Pictures the planner uses that haven't been drawn yet: they print as placeholders */
export const PLANNER_ONLY_PICTURES: Record<string, string> = {
  pencil: 'pencil',
  tv: 'tv',
  pyjamas: 'pyjamas',
  friends: 'friends',
};
