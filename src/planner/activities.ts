/**
 * @license
 * Sunshine Brigade Worksheet Builder - Planner activities
 *
 * The routine activities and things to pack in the planner library (Just My Planner's starter blocks),
 * each shown with a Phosphor icon ("ph:<Name>", see plannerIcons.tsx).
 */

export type ActivityGroup = 'morning' | 'learning' | 'meals' | 'play' | 'winddown' | 'pack';

export interface PlannerActivity {
  id: string;
  label: string;
  picture: string;
  group: ActivityGroup;
  /** Usual length in minutes (15-minute steps, up to 3 hours) */
  minutes: number;
}

export const ACTIVITY_GROUPS: { id: ActivityGroup; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'learning', label: 'School and learning' },
  { id: 'meals', label: 'Meals and snacks' },
  { id: 'play', label: 'Play and outside' },
  { id: 'winddown', label: 'Wind down' },
  { id: 'pack', label: 'Things to pack' },
];

export const ACTIVITIES: PlannerActivity[] = [
  { id: 'wake-up', label: 'Wake up', picture: 'ph:Sun', group: 'morning', minutes: 15 },
  { id: 'brush-teeth', label: 'Brush teeth', picture: 'ph:Tooth', group: 'morning', minutes: 15 },
  { id: 'wash-face', label: 'Wash face', picture: 'ph:HandSoap', group: 'morning', minutes: 15 },
  { id: 'get-dressed', label: 'Get dressed', picture: 'ph:TShirt', group: 'morning', minutes: 15 },
  { id: 'make-bed', label: 'Make bed', picture: 'ph:Bed', group: 'morning', minutes: 15 },
  { id: 'breakfast', label: 'Breakfast', picture: 'ph:BowlFood', group: 'morning', minutes: 30 },
  { id: 'pack-bag', label: 'Pack backpack', picture: 'ph:Backpack', group: 'morning', minutes: 15 },
  { id: 'shoes-on', label: 'Shoes on', picture: 'ph:Sneaker', group: 'morning', minutes: 15 },

  { id: 'school', label: 'School time', picture: 'ph:Student', group: 'learning', minutes: 180 },
  { id: 'reading', label: 'Reading books', picture: 'ph:BookOpen', group: 'learning', minutes: 30 },
  { id: 'homework', label: 'Homework', picture: 'ph:PencilSimple', group: 'learning', minutes: 30 },
  { id: 'music', label: 'Music practice', picture: 'ph:MusicNotes', group: 'learning', minutes: 30 },
  { id: 'art', label: 'Art and crafts', picture: 'ph:PaintBrush', group: 'learning', minutes: 60 },
  { id: 'circle-time', label: 'Circle time', picture: 'ph:UsersThree', group: 'learning', minutes: 30 },
  { id: 'puzzles', label: 'Puzzles', picture: 'ph:PuzzlePiece', group: 'learning', minutes: 30 },

  { id: 'snack', label: 'Snack', picture: 'ph:OrangeSlice', group: 'meals', minutes: 15 },
  { id: 'lunch', label: 'Lunch', picture: 'ph:Hamburger', group: 'meals', minutes: 30 },
  { id: 'treat', label: 'Treat', picture: 'ph:Cookie', group: 'meals', minutes: 30 },
  { id: 'dinner', label: 'Dinner', picture: 'ph:ForkKnife', group: 'meals', minutes: 60 },
  { id: 'water', label: 'Drink water', picture: 'ph:Drop', group: 'meals', minutes: 15 },
  { id: 'milk', label: 'Milk', picture: 'ph:Coffee', group: 'meals', minutes: 15 },

  { id: 'outside', label: 'Outside play', picture: 'ph:Tree', group: 'play', minutes: 60 },
  { id: 'playground', label: 'Playground', picture: 'ph:Park', group: 'play', minutes: 60 },
  { id: 'free-play', label: 'Free play', picture: 'ph:Shapes', group: 'play', minutes: 60 },
  { id: 'ball', label: 'Sports', picture: 'ph:SoccerBall', group: 'play', minutes: 60 },
  { id: 'bike', label: 'Bike ride', picture: 'ph:Bicycle', group: 'play', minutes: 60 },
  { id: 'swimming', label: 'Swimming', picture: 'ph:SwimmingPool', group: 'play', minutes: 60 },
  { id: 'pets', label: 'Care for pets', picture: 'ph:Dog', group: 'play', minutes: 30 },
  { id: 'screen', label: 'Screen time', picture: 'ph:Television', group: 'play', minutes: 30 },
  { id: 'tidy', label: 'Tidy up toys', picture: 'ph:Broom', group: 'play', minutes: 15 },

  { id: 'nap', label: 'Nap', picture: 'ph:MoonStars', group: 'winddown', minutes: 60 },
  { id: 'bath', label: 'Bath time', picture: 'ph:Bathtub', group: 'winddown', minutes: 30 },
  { id: 'pyjamas', label: 'Pyjamas on', picture: 'ph:Hoodie', group: 'winddown', minutes: 15 },
  { id: 'story', label: 'Story time', picture: 'ph:Book', group: 'winddown', minutes: 30 },
  { id: 'teeth-night', label: 'Brush teeth', picture: 'ph:Tooth', group: 'winddown', minutes: 15 },
  { id: 'bedtime', label: 'Bedtime', picture: 'ph:Bed', group: 'winddown', minutes: 30 },

  // Things to pack: for packing lists the child ticks off with a grown-up
  { id: 'clothes', label: 'Spare clothes', picture: 'ph:TShirt', group: 'pack', minutes: 30 },
  { id: 'pack-pyjamas', label: 'Pyjamas', picture: 'ph:Hoodie', group: 'pack', minutes: 30 },
  { id: 'jacket', label: 'Jacket', picture: 'ph:Hoodie', group: 'pack', minutes: 30 },
  { id: 'pack-shoes', label: 'Shoes', picture: 'ph:Sneaker', group: 'pack', minutes: 30 },
  { id: 'boots', label: 'Boots', picture: 'ph:Boot', group: 'pack', minutes: 30 },
  { id: 'socks', label: 'Socks', picture: 'ph:Sock', group: 'pack', minutes: 30 },
  { id: 'hat', label: 'Hat', picture: 'ph:BaseballCap', group: 'pack', minutes: 30 },
  { id: 'sunglasses', label: 'Sunglasses', picture: 'ph:Sunglasses', group: 'pack', minutes: 30 },
  { id: 'goggles', label: 'Swim goggles', picture: 'ph:Goggles', group: 'pack', minutes: 30 },
  { id: 'towel', label: 'Towel', picture: 'ph:Towel', group: 'pack', minutes: 30 },
  { id: 'umbrella', label: 'Umbrella', picture: 'ph:Umbrella', group: 'pack', minutes: 30 },
  { id: 'water-bottle', label: 'Water bottle', picture: 'ph:Drop', group: 'pack', minutes: 30 },
  { id: 'pack-snack', label: 'Snacks', picture: 'ph:OrangeSlice', group: 'pack', minutes: 30 },
  { id: 'lunchbox', label: 'Lunch', picture: 'ph:BowlFood', group: 'pack', minutes: 30 },
  { id: 'toothbrush', label: 'Toothbrush', picture: 'ph:Tooth', group: 'pack', minutes: 30 },
  { id: 'soap', label: 'Soap', picture: 'ph:HandSoap', group: 'pack', minutes: 30 },
  { id: 'pack-book', label: 'Book', picture: 'ph:Book', group: 'pack', minutes: 30 },
  { id: 'toy', label: 'Favourite toy', picture: 'ph:Cube', group: 'pack', minutes: 30 },
  { id: 'pillow', label: 'Pillow', picture: 'ph:Bed', group: 'pack', minutes: 30 },
  { id: 'headphones', label: 'Headphones', picture: 'ph:Headphones', group: 'pack', minutes: 30 },
  { id: 'tablet', label: 'Tablet', picture: 'ph:DeviceMobile', group: 'pack', minutes: 30 },
  { id: 'charger', label: 'Charger', picture: 'ph:BatteryCharging', group: 'pack', minutes: 30 },
  { id: 'camera', label: 'Camera', picture: 'ph:Camera', group: 'pack', minutes: 30 },
  { id: 'flashlight', label: 'Flashlight', picture: 'ph:Flashlight', group: 'pack', minutes: 30 },
  { id: 'first-aid', label: 'First aid kit', picture: 'ph:FirstAidKit', group: 'pack', minutes: 30 },
  { id: 'medicine', label: 'Medicine', picture: 'ph:Pill', group: 'pack', minutes: 30 },
  { id: 'diapers', label: 'Diapers', picture: 'ph:Baby', group: 'pack', minutes: 30 },
  { id: 'tickets', label: 'Tickets', picture: 'ph:Ticket', group: 'pack', minutes: 30 },
  { id: 'permission-slip', label: 'Permission slip', picture: 'ph:Envelope', group: 'pack', minutes: 30 },
  { id: 'keys', label: 'Keys', picture: 'ph:Key', group: 'pack', minutes: 30 },
  { id: 'wallet', label: 'Wallet', picture: 'ph:Wallet', group: 'pack', minutes: 30 },
  { id: 'present', label: 'Present', picture: 'ph:Gift', group: 'pack', minutes: 30 },
  { id: 'suitcase', label: 'Suitcase', picture: 'ph:Suitcase', group: 'pack', minutes: 30 },
  { id: 'pack-backpack', label: 'Backpack', picture: 'ph:Backpack', group: 'pack', minutes: 30 },
];

export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);
