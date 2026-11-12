/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner activities
 *
 * The routine activities in the planner library (Just My Planner's starter blocks),
 * each shown with a Phosphor icon ("ph:<Name>", see plannerIcons.tsx).
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
  { id: 'wake-up', label: 'Wake up', picture: 'ph:Sun', group: 'morning', minutes: 30 },
  { id: 'brush-teeth', label: 'Brush teeth', picture: 'ph:Tooth', group: 'morning', minutes: 30 },
  { id: 'wash-face', label: 'Wash face', picture: 'ph:HandSoap', group: 'morning', minutes: 30 },
  { id: 'get-dressed', label: 'Get dressed', picture: 'ph:TShirt', group: 'morning', minutes: 30 },
  { id: 'make-bed', label: 'Make bed', picture: 'ph:Bed', group: 'morning', minutes: 30 },
  { id: 'breakfast', label: 'Breakfast', picture: 'ph:BowlFood', group: 'morning', minutes: 30 },
  { id: 'pack-bag', label: 'Pack backpack', picture: 'ph:Backpack', group: 'morning', minutes: 30 },
  { id: 'shoes-on', label: 'Shoes on', picture: 'ph:Sneaker', group: 'morning', minutes: 30 },

  { id: 'school', label: 'School time', picture: 'ph:Student', group: 'learning', minutes: 180 },
  { id: 'reading', label: 'Reading books', picture: 'ph:BookOpen', group: 'learning', minutes: 30 },
  { id: 'homework', label: 'Homework', picture: 'ph:PencilSimple', group: 'learning', minutes: 30 },
  { id: 'music', label: 'Music practice', picture: 'ph:MusicNotes', group: 'learning', minutes: 30 },
  { id: 'art', label: 'Art and crafts', picture: 'ph:PaintBrush', group: 'learning', minutes: 60 },
  { id: 'circle-time', label: 'Circle time', picture: 'ph:UsersThree', group: 'learning', minutes: 30 },
  { id: 'puzzles', label: 'Puzzles', picture: 'ph:PuzzlePiece', group: 'learning', minutes: 30 },

  { id: 'snack', label: 'Snack', picture: 'ph:OrangeSlice', group: 'meals', minutes: 30 },
  { id: 'lunch', label: 'Lunch', picture: 'ph:Hamburger', group: 'meals', minutes: 30 },
  { id: 'treat', label: 'Treat', picture: 'ph:Cookie', group: 'meals', minutes: 30 },
  { id: 'dinner', label: 'Dinner', picture: 'ph:ForkKnife', group: 'meals', minutes: 60 },
  { id: 'water', label: 'Drink water', picture: 'ph:Drop', group: 'meals', minutes: 30 },
  { id: 'milk', label: 'Milk', picture: 'ph:Coffee', group: 'meals', minutes: 30 },

  { id: 'outside', label: 'Outside play', picture: 'ph:Tree', group: 'play', minutes: 60 },
  { id: 'playground', label: 'Playground', picture: 'ph:Park', group: 'play', minutes: 60 },
  { id: 'free-play', label: 'Free play', picture: 'ph:Shapes', group: 'play', minutes: 60 },
  { id: 'ball', label: 'Sports', picture: 'ph:SoccerBall', group: 'play', minutes: 60 },
  { id: 'bike', label: 'Bike ride', picture: 'ph:Bicycle', group: 'play', minutes: 60 },
  { id: 'swimming', label: 'Swimming', picture: 'ph:SwimmingPool', group: 'play', minutes: 60 },
  { id: 'pets', label: 'Care for pets', picture: 'ph:Dog', group: 'play', minutes: 30 },
  { id: 'screen', label: 'Screen time', picture: 'ph:Television', group: 'play', minutes: 30 },
  { id: 'tidy', label: 'Tidy up toys', picture: 'ph:Broom', group: 'play', minutes: 30 },

  { id: 'nap', label: 'Nap', picture: 'ph:MoonStars', group: 'winddown', minutes: 60 },
  { id: 'bath', label: 'Bath time', picture: 'ph:Bathtub', group: 'winddown', minutes: 30 },
  { id: 'pyjamas', label: 'Pyjamas on', picture: 'ph:Hoodie', group: 'winddown', minutes: 30 },
  { id: 'story', label: 'Story time', picture: 'ph:Book', group: 'winddown', minutes: 30 },
  { id: 'teeth-night', label: 'Brush teeth', picture: 'ph:Tooth', group: 'winddown', minutes: 30 },
  { id: 'bedtime', label: 'Bedtime', picture: 'ph:Bed', group: 'winddown', minutes: 30 },
];

export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);
