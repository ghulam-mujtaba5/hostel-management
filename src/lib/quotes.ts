/**
 * Islamic-inspired and motivational quotes for HostelMate
 * These quotes promote good values, teamwork, and responsibility
 */

export interface Quote {
  text: string;
  source?: string;
  category: 'motivation' | 'teamwork' | 'responsibility' | 'gratitude' | 'excellence' | 'greeting';
}

// Morning greetings with Islamic touch
export const GREETINGS: Quote[] = [
  { text: "Assalamu Alaikum! Ready to make today productive?", category: 'greeting' },
  { text: "Bismillah! Let's start this day with good intentions", category: 'greeting' },
  { text: "May your day be blessed with barakah ✨", category: 'greeting' },
  { text: "In the name of Allah, the Most Gracious, the Most Merciful", category: 'greeting' },
  { text: "Start with Bismillah, end with Alhamdulillah 🤲", category: 'greeting' },
];

// Motivational quotes with Islamic values
export const MOTIVATIONAL_QUOTES: Quote[] = [
  // Excellence & Quality
  { 
    text: "Allah loves when you do something, you do it with excellence (Ihsan)",
    source: "Prophet Muhammad ﷺ",
    category: 'excellence'
  },
  { 
    text: "The best among you are those who are most beneficial to others",
    source: "Prophet Muhammad ﷺ",
    category: 'teamwork'
  },
  { 
    text: "Cleanliness is half of faith",
    source: "Prophet Muhammad ﷺ",
    category: 'responsibility'
  },
  
  // Teamwork & Community
  { 
    text: "The believers are like one body; if one part hurts, the whole body feels it",
    source: "Prophet Muhammad ﷺ",
    category: 'teamwork'
  },
  { 
    text: "None of you truly believes until you wish for your brother what you wish for yourself",
    source: "Prophet Muhammad ﷺ",
    category: 'teamwork'
  },
  { 
    text: "Help your brother, whether he is an oppressor or oppressed",
    source: "Prophet Muhammad ﷺ",
    category: 'teamwork'
  },
  
  // Responsibility & Action
  { 
    text: "Take care of yourself and your home, for that is also a form of charity",
    category: 'responsibility'
  },
  { 
    text: "The strong believer is better than the weak believer, but there is good in both",
    source: "Prophet Muhammad ﷺ",
    category: 'motivation'
  },
  { 
    text: "Tie your camel first, then put your trust in Allah",
    source: "Prophet Muhammad ﷺ",
    category: 'responsibility'
  },
  
  // Gratitude
  { 
    text: "If you are grateful, I will surely increase you [in favor]",
    source: "Quran 14:7",
    category: 'gratitude'
  },
  { 
    text: "Whoever is not grateful for small things will not be grateful for big things",
    source: "Prophet Muhammad ﷺ",
    category: 'gratitude'
  },
  { 
    text: "Alhamdulillah for the blessings we often forget to count 🤲",
    category: 'gratitude'
  },
  
  // General Motivation
  { 
    text: "Every good deed is charity, even a smile",
    source: "Prophet Muhammad ﷺ",
    category: 'motivation'
  },
  { 
    text: "The best of people are those most beneficial to people",
    source: "Prophet Muhammad ﷺ",
    category: 'motivation'
  },
  { 
    text: "Do good and throw it in the sea—if the fish don't appreciate it, Allah will",
    category: 'motivation'
  },
  { 
    text: "Small consistent actions are more beloved than large occasional ones",
    source: "Prophet Muhammad ﷺ",
    category: 'excellence'
  },
];

// Task completion messages
export const TASK_COMPLETION_MESSAGES: string[] = [
  "MashaAllah! Another task completed! 🌟",
  "Alhamdulillah! Great work on that task! ✨",
  "SubhanAllah! You're on fire today! 🔥",
  "JazakAllah Khair to yourself for completing this! 🤲",
  "Barakallahu Feek! Keep up the excellent work! 💪",
  "MashaAllah! Your flatmates will appreciate this! 🏠",
  "Alhamdulillah! One step closer to a cleaner home! 🧹",
  "Excellence achieved! Allah loves Ihsan! ⭐",
];

// Streak milestone messages
export const STREAK_MESSAGES: Record<number, string> = {
  3: "3-day streak! Consistency is key! 🔥",
  7: "A full week! MashaAllah, you're unstoppable! 🌟",
  14: "Two weeks strong! Your dedication inspires others! 💪",
  21: "21 days! A habit is forming! SubhanAllah! 🎯",
  30: "A whole month! You're a true champion! 👑",
  50: "50 days! Legendary status achieved! 🏆",
  100: "100 DAYS! You've reached elite status! MashaAllah! 🌙",
};

// Get random quote by category
export function getRandomQuote(category?: Quote['category']): Quote {
  const quotes = category 
    ? MOTIVATIONAL_QUOTES.filter(q => q.category === category)
    : MOTIVATIONAL_QUOTES;
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Get random greeting
export function getRandomGreeting(): Quote {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

// Get random task completion message
export function getTaskCompletionMessage(): string {
  return TASK_COMPLETION_MESSAGES[Math.floor(Math.random() * TASK_COMPLETION_MESSAGES.length)];
}

// Get time-appropriate greeting
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 3 && hour < 12) {
    return "Assalamu Alaikum! Good morning ☀️";
  } else if (hour >= 12 && hour < 17) {
    return "Assalamu Alaikum! Good afternoon 🌤️";
  } else if (hour >= 17 && hour < 21) {
    return "Assalamu Alaikum! Good evening 🌅";
  } else {
    return "Assalamu Alaikum! Good night 🌙";
  }
}

// Get day-specific motivation
export function getDaySpecificMotivation(): string {
  const day = new Date().getDay();
  
  const dayMessages: Record<number, string> = {
    0: "Blessed Sunday! Start the week with barakah 🌟",
    1: "New week, new opportunities! Bismillah! 💪",
    2: "Tuesday energy! Keep pushing forward! 🚀",
    3: "Midweek momentum! You're halfway there! ⚡",
    4: "Thursday vibes! Almost to Jummah! 🌙",
    5: "Jummah Mubarak! 🕌 May your day be blessed!",
    6: "Blessed Saturday! Time to recharge and reflect 🤲",
  };
  
  return dayMessages[day] || "Have a blessed day!";
}
