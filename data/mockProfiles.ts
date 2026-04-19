export interface MockProfile {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  distance: number;
  interests: string[];
  verified: boolean;
  job?: string;
  education?: string;
}

export const MOCK_PROFILES: MockProfile[] = [
  {
    id: 'p1',
    name: 'Sophia',
    age: 25,
    bio: 'Coffee enthusiast ☕ | Yoga instructor | Looking for someone to explore hidden gems in the city with 🌆',
    photos: [
      'https://picsum.photos/seed/sophia1/400/600',
      'https://picsum.photos/seed/sophia2/400/600',
      'https://picsum.photos/seed/sophia3/400/600',
    ],
    distance: 2,
    interests: ['Yoga', 'Coffee', 'Travel', 'Photography', 'Art'],
    verified: true,
    job: 'Yoga Instructor',
    education: 'University of Arts',
  },
  {
    id: 'p2',
    name: 'Emma',
    age: 23,
    bio: 'Bookworm 📚 | Amateur chef | Dog lover 🐕 | Hiking on weekends',
    photos: [
      'https://picsum.photos/seed/emma1/400/600',
      'https://picsum.photos/seed/emma2/400/600',
    ],
    distance: 5,
    interests: ['Reading', 'Cooking', 'Hiking', 'Dogs', 'Nature'],
    verified: false,
    job: 'UX Designer',
    education: 'Design Academy',
  },
  {
    id: 'p3',
    name: 'Mia',
    age: 27,
    bio: 'Music is my language 🎵 | Guitarist | Jazz bars on Fridays | Always down for spontaneous adventures',
    photos: [
      'https://picsum.photos/seed/mia1/400/600',
      'https://picsum.photos/seed/mia2/400/600',
      'https://picsum.photos/seed/mia3/400/600',
    ],
    distance: 3,
    interests: ['Music', 'Guitar', 'Jazz', 'Travel', 'Concerts'],
    verified: true,
    job: 'Music Teacher',
    education: 'Berklee College of Music',
  },
  {
    id: 'p4',
    name: 'Olivia',
    age: 24,
    bio: 'Foodie first, everything else second 🍜 | Traveling to eat my way around the world',
    photos: [
      'https://picsum.photos/seed/olivia1/400/600',
      'https://picsum.photos/seed/olivia2/400/600',
    ],
    distance: 8,
    interests: ['Food', 'Travel', 'Cooking', 'Culture', 'Wine'],
    verified: true,
    job: 'Food Blogger',
    education: 'Culinary Institute',
  },
  {
    id: 'p5',
    name: 'Ava',
    age: 26,
    bio: 'Tech geek by day, stargazer by night 🔭 | Aspiring astronaut | Board game nights with friends',
    photos: [
      'https://picsum.photos/seed/ava1/400/600',
      'https://picsum.photos/seed/ava2/400/600',
      'https://picsum.photos/seed/ava3/400/600',
    ],
    distance: 1,
    interests: ['Tech', 'Astronomy', 'Board Games', 'Science', 'Coding'],
    verified: false,
    job: 'Software Engineer',
    education: 'MIT',
  },
  {
    id: 'p6',
    name: 'Isabella',
    age: 29,
    bio: 'Architect dreaming of sustainable cities 🏙️ | Runner | Minimalist lifestyle',
    photos: [
      'https://picsum.photos/seed/isabella1/400/600',
      'https://picsum.photos/seed/isabella2/400/600',
    ],
    distance: 12,
    interests: ['Architecture', 'Running', 'Sustainability', 'Minimalism', 'Design'],
    verified: true,
    job: 'Architect',
    education: 'Harvard GSD',
  },
  {
    id: 'p7',
    name: 'Charlotte',
    age: 22,
    bio: 'Art history student | Museum hopper | Trying to paint but mostly just appreciating others work 🎨',
    photos: [
      'https://picsum.photos/seed/charlotte1/400/600',
      'https://picsum.photos/seed/charlotte2/400/600',
      'https://picsum.photos/seed/charlotte3/400/600',
    ],
    distance: 6,
    interests: ['Art', 'Museums', 'History', 'Painting', 'Culture'],
    verified: false,
    job: 'Student',
    education: 'NYU Art History',
  },
  {
    id: 'p8',
    name: 'Luna',
    age: 28,
    bio: 'Yoga + meditation daily 🧘 | Certified wellness coach | Manifesting good vibes',
    photos: [
      'https://picsum.photos/seed/luna1/400/600',
      'https://picsum.photos/seed/luna2/400/600',
    ],
    distance: 4,
    interests: ['Wellness', 'Meditation', 'Yoga', 'Crystals', 'Journaling'],
    verified: true,
    job: 'Wellness Coach',
    education: 'Yoga Alliance Certified',
  },
  {
    id: 'p9',
    name: 'Harper',
    age: 25,
    bio: 'Marine biologist protecting our oceans 🐠 | SCUBA diver | Ocean is my home',
    photos: [
      'https://picsum.photos/seed/harper1/400/600',
      'https://picsum.photos/seed/harper2/400/600',
      'https://picsum.photos/seed/harper3/400/600',
    ],
    distance: 15,
    interests: ['Marine Biology', 'Diving', 'Ocean', 'Environment', 'Travel'],
    verified: true,
    job: 'Marine Biologist',
    education: 'Stanford University',
  },
  {
    id: 'p10',
    name: 'Zoe',
    age: 30,
    bio: 'Chef & restaurateur 👩‍🍳 | Michelin star dreams | Teaching cooking classes on weekends',
    photos: [
      'https://picsum.photos/seed/zoe1/400/600',
      'https://picsum.photos/seed/zoe2/400/600',
    ],
    distance: 7,
    interests: ['Cooking', 'Restaurant', 'Wine', 'Food', 'Travel'],
    verified: true,
    job: 'Executive Chef',
    education: 'Le Cordon Bleu',
  },
  {
    id: 'p11',
    name: 'Aria',
    age: 24,
    bio: 'Photographer capturing life one click at a time 📷 | Portrait & street photography',
    photos: [
      'https://picsum.photos/seed/aria1/400/600',
      'https://picsum.photos/seed/aria2/400/600',
      'https://picsum.photos/seed/aria3/400/600',
    ],
    distance: 9,
    interests: ['Photography', 'Art', 'Travel', 'Fashion', 'Cinema'],
    verified: false,
    job: 'Photographer',
    education: 'School of Visual Arts',
  },
  {
    id: 'p12',
    name: 'Elena',
    age: 26,
    bio: 'Lawyer fighting for justice ⚖️ | Runner | Bookclub every Sunday | Lover of good debates',
    photos: [
      'https://picsum.photos/seed/elena1/400/600',
      'https://picsum.photos/seed/elena2/400/600',
    ],
    distance: 3,
    interests: ['Law', 'Running', 'Books', 'Debates', 'Politics'],
    verified: true,
    job: 'Attorney',
    education: 'Yale Law School',
  },
];

export const INTERESTS_LIST = [
  'Travel', 'Coffee', 'Music', 'Yoga', 'Fitness', 'Cooking', 'Art',
  'Photography', 'Movies', 'Books', 'Gaming', 'Hiking', 'Dancing',
  'Foodie', 'Nature', 'Sports', 'Meditation', 'Fashion', 'Tech',
  'Dogs', 'Cats', 'Wine', 'Cycling', 'Swimming', 'Climbing',
];
