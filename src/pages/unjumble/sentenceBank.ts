export const sentenceBank = [
  // Basic English
  "The cat sat on the mat",
  "I love to read books everyday",
  "She plays the piano beautifully",
  "We are going to the park",
  "The sun rises in the east",
  "My favorite color is blue",
  "Can you help me with this?",
  "It is raining outside now",
  "They are playing football together",
  "He drinks coffee every morning",

  // Intermediate
  "The quick brown fox jumps over the lazy dog",
  "Technology is changing the way we live",
  "Education is the key to success",
  "Practice makes perfect in everything",
  "Honesty is the best policy always",
  "A journey of a thousand miles begins with a single step",
  "Knowledge is power but enthusiasm pulls the switch",
  "Time waits for no one so use it wisely",
  "Better late than never but never late is better",
  "Action speaks louder than words",

  // Fun Facts
  "Honey never spoils and can last for centuries",
  "Octopuses have three hearts and blue blood",
  "Bananas are berries but strawberries are not",
  "Dolphins sleep with one eye open",
  "Elephants are the only animals that cannot jump",
  "Butterflies taste with their feet",
  "A group of flamingos is called a flamboyance",
  "Sloths can hold their breath longer than dolphins",
  "Apples float because they are mostly air",
  "Cows have best friends and get stressed when separated",

  // Daily Conversation
  "What time do you usually wake up?",
  "Have a nice day ahead",
  "Thank you for your help today",
  "Where is the nearest train station?",
  "I would like to order a pizza",
  "How much does this shirt cost?",
  "Nice to meet you my friend",
  "See you later alligator",
  "What is your favorite food?",
  "Do you have any plans for the weekend?",
];

export const getRandomSentences = (count: number = 1): string[] => {
  const shuffled = [...sentenceBank].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
