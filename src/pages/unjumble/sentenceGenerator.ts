// This is a simple client-side sentence generator
// In a real application, this would call an AI endpoint

import { UNJUMBLE_SENTENCES } from "./unjumbleSentences";

const SENTENCE_TEMPLATES: Record<string, string[]> = {
  general: [
    ...UNJUMBLE_SENTENCES,
    "The quick brown fox jumps over the lazy dog",
    "A journey of a thousand miles begins with a single step",
    "To be or not to be that is the question",
    "All that glitters is not gold",
    "Actions speak louder than words",
    "Better late than never",
    "Birds of a feather flock together",
    "Cleanliness is next to godliness",
  ],
  nature: [
    "The sun rises in the east",
    "Water flows from high to low places",
    "Trees provide oxygen for us to breathe",
    "The ocean is deep and blue",
    "Birds fly high in the sky",
    "Flowers bloom in the spring",
  ],
  grammar: [
    "She plays the piano very well",
    "They are going to the market",
    "He has been working here for ten years",
    "I will finish my homework tomorrow",
    "We have visited that museum before",
    "Do you like to drink coffee or tea ?",
  ],
  coding: [
    "Console log is your best friend",
    "Always write clear and maintainable code",
    "Functions should do one thing well",
    "React components are reusable UI blocks",
    "TypeScript adds static types to JavaScript",
    "Infinite loops can crash your browser",
  ],
  history: [
    "Rome was not built in a day",
    "The industrial revolution changed the world",
    "History repeats itself",
    "Ancient civilizations built great monuments",
    "Explorers sailed across the seven seas",
  ],
};

export const generateSentences = async (
  topic: string,
  count: number,
): Promise<string[]> => {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const normalizedTopic = topic.toLowerCase().trim();
  let pool = SENTENCE_TEMPLATES["general"];

  // Simple keyword matching
  if (
    normalizedTopic.includes("nature") ||
    normalizedTopic.includes("animal")
  ) {
    pool = SENTENCE_TEMPLATES["nature"];
  } else if (
    normalizedTopic.includes("grammar") ||
    normalizedTopic.includes("english")
  ) {
    pool = SENTENCE_TEMPLATES["grammar"];
  } else if (
    normalizedTopic.includes("code") ||
    normalizedTopic.includes("programm")
  ) {
    pool = SENTENCE_TEMPLATES["coding"];
  } else if (
    normalizedTopic.includes("history") ||
    normalizedTopic.includes("past")
  ) {
    pool = SENTENCE_TEMPLATES["history"];
  } else if (
    normalizedTopic.includes("logic") ||
    normalizedTopic.includes("logika")
  ) {
    // Explicitly use the new logical sentences
    pool = UNJUMBLE_SENTENCES;
  }

  // Start with the selected pool
  let candidates = [...pool];

  // If the topic didn't match any category specifically (and wasn't logic),
  // we might want to mix in some dynamic sentences if the topic is long enough to be a noun/subject
  const knownCategories = [
    "nature",
    "animal",
    "grammar",
    "english",
    "code",
    "programm",
    "history",
    "past",
    "logic",
    "logika",
    "general",
  ];
  const isUnknown = !knownCategories.some((cat) =>
    normalizedTopic.includes(cat),
  );

  if (isUnknown && normalizedTopic.length > 2) {
    // Create some dynamic sentences for the specific topic
    const dynamicSentences = [
      `I really like learning about ${topic} .`,
      `${topic} is a very interesting subject .`,
      `Have you ever studied ${topic} before ?`,
      `The most important thing about ${topic} is practice .`,
      `We should read more books about ${topic} .`,
    ];
    // Add them to the pool to increase relevance
    candidates = [...dynamicSentences, ...candidates];
  }

  // Shuffle and slice
  const shuffled = candidates.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
