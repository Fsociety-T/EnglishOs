import type { Topic } from '@/types'

/**
 * Prompts to practise against. Each one asks for a specific experience or
 * opinion rather than a vague theme, because "describe a place you visited"
 * produces far more usable language than "talk about travel".
 */
export const TOPICS: Topic[] = [
  // --- Daily life -----------------------------------------------------------
  { id: 't1', title: 'A place you visited recently', prompt: 'Describe a place you went to recently. Who were you with, what did you do, and would you go back?', category: 'Daily life', level: 'A2' },
  { id: 't2', title: 'Your typical morning', prompt: 'Walk me through your morning from waking up to starting your day. What would you change about it?', category: 'Daily life', level: 'A2' },
  { id: 't3', title: 'A meal you love', prompt: 'Describe a meal you really enjoy. What is in it, who makes it best, and why does it matter to you?', category: 'Daily life', level: 'A2' },
  { id: 't4', title: 'Something you bought recently', prompt: 'What did you buy recently? Why did you choose it, and was it worth the money?', category: 'Daily life', level: 'A2' },
  { id: 't5', title: 'How you spend your weekend', prompt: 'Describe a normal weekend for you. Is it restful or busy? What would your ideal weekend look like?', category: 'Daily life', level: 'A2' },
  { id: 't6', title: 'A habit you want to change', prompt: 'Describe a habit you would like to change. Why is it hard, and what have you tried so far?', category: 'Daily life', level: 'B1' },

  // --- Personal story -------------------------------------------------------
  { id: 't7', title: 'A time you were proud of yourself', prompt: 'Tell the story of something you achieved. What made it difficult, and how did you feel afterwards?', category: 'Personal story', level: 'B1' },
  { id: 't8', title: 'A mistake that taught you something', prompt: 'Describe a mistake you made. What happened, and what would you do differently now?', category: 'Personal story', level: 'B1' },
  { id: 't9', title: 'The best day of your life so far', prompt: 'Describe the best day you can remember. Where were you, who was there, and why does it stand out?', category: 'Personal story', level: 'B1' },
  { id: 't10', title: 'Someone who influenced you', prompt: 'Describe a person who changed how you think. What did they do or say, and how did it affect you?', category: 'Personal story', level: 'B1' },
  { id: 't11', title: 'A difficult decision you made', prompt: 'Describe a hard choice you had to make. What were the options, and how did you decide?', category: 'Personal story', level: 'B2' },
  { id: 't12', title: 'A fear you overcame', prompt: 'Describe something you were afraid of and how you dealt with it. Are you still afraid of it?', category: 'Personal story', level: 'B2' },

  // --- Opinion --------------------------------------------------------------
  { id: 't13', title: 'Is social media good or bad for us?', prompt: 'Give your opinion on social media. Support it with at least two reasons and one example from your own life.', category: 'Opinion', level: 'B1' },
  { id: 't14', title: 'Should university be free?', prompt: 'Argue for or against free university education. Consider who pays and who benefits.', category: 'Opinion', level: 'B2' },
  { id: 't15', title: 'Is it better to live in a city or the countryside?', prompt: 'Compare city and countryside life. Which suits you better, and why?', category: 'Opinion', level: 'B1' },
  { id: 't16', title: 'Do we work too much?', prompt: 'Do you think people work too many hours? What would change if the working week were shorter?', category: 'Opinion', level: 'B2' },
  { id: 't17', title: 'Should everyone learn a second language?', prompt: 'Argue your position. What does learning a language give you beyond the language itself?', category: 'Opinion', level: 'B1' },
  { id: 't18', title: 'Is money the main reason people work?', prompt: 'Explain what really motivates people at work, in your view. Use examples.', category: 'Opinion', level: 'B2' },

  // --- Work and study -------------------------------------------------------
  { id: 't19', title: 'Your dream job', prompt: 'Describe the job you would love to have. What would a typical day look like, and what is stopping you?', category: 'Work and study', level: 'A2' },
  { id: 't20', title: 'A skill you are learning', prompt: 'Describe a skill you are working on. How are you learning it, and how will you know you are good at it?', category: 'Work and study', level: 'B1' },
  { id: 't21', title: 'The best way to learn English', prompt: 'What has actually worked for you in learning English? What has not worked?', category: 'Work and study', level: 'B1' },
  { id: 't22', title: 'A teacher you remember', prompt: 'Describe a teacher who made an impression on you, good or bad. What did they do differently?', category: 'Work and study', level: 'B1' },
  { id: 't23', title: 'Working alone or in a team', prompt: 'Which do you prefer and why? Give an example of when the other one worked better.', category: 'Work and study', level: 'B2' },
  { id: 't24', title: 'How you handle pressure', prompt: 'Describe how you deal with deadlines or stress. Give a real example.', category: 'Work and study', level: 'B2' },

  // --- Travel ---------------------------------------------------------------
  { id: 't25', title: 'A country you want to visit', prompt: 'Where do you want to go, and what specifically do you want to do there?', category: 'Travel', level: 'A2' },
  { id: 't26', title: 'A journey that went wrong', prompt: 'Tell the story of a trip where something went wrong. How did it end?', category: 'Travel', level: 'B1' },
  { id: 't27', title: 'Your city, to a visitor', prompt: 'Explain your city to someone who has never been. What should they see, and what should they skip?', category: 'Travel', level: 'B1' },
  { id: 't28', title: 'Travelling alone or with others', prompt: 'Which do you prefer? What do you gain and lose with each?', category: 'Travel', level: 'B2' },

  // --- Technology -----------------------------------------------------------
  { id: 't29', title: 'An app you use every day', prompt: 'Describe an app you rely on. What does it do well, and what frustrates you about it?', category: 'Technology', level: 'A2' },
  { id: 't30', title: 'Will AI take our jobs?', prompt: 'Give your view on AI and work. Which jobs are at risk, and which are safe?', category: 'Technology', level: 'B2' },
  { id: 't31', title: 'Life before smartphones', prompt: 'How was life different before smartphones? Was anything better?', category: 'Technology', level: 'B1' },
  { id: 't32', title: 'A piece of technology you would remove', prompt: 'If you could delete one technology from the world, what would it be and why?', category: 'Technology', level: 'B2' },

  // --- Culture --------------------------------------------------------------
  { id: 't33', title: 'A film or series you recommend', prompt: 'Describe something you watched recently. What is it about, and who would enjoy it?', category: 'Culture', level: 'A2' },
  { id: 't34', title: 'A book that changed your mind', prompt: 'Describe a book that changed how you see something. What was the idea?', category: 'Culture', level: 'B2' },
  { id: 't35', title: 'A tradition in your country', prompt: 'Explain a tradition or celebration to someone from outside your culture.', category: 'Culture', level: 'B1' },
  { id: 't36', title: 'Music that means something to you', prompt: 'Describe a song or artist that matters to you and explain why.', category: 'Culture', level: 'B1' },

  // --- Society --------------------------------------------------------------
  { id: 't37', title: 'The biggest problem in your city', prompt: 'What is the most serious problem where you live? What would you do about it?', category: 'Society', level: 'B2' },
  { id: 't38', title: 'How should we deal with climate change?', prompt: 'What should individuals do, and what should governments do? Are both equally important?', category: 'Society', level: 'B2' },
  { id: 't39', title: 'Is life better now than 50 years ago?', prompt: 'Compare life today with life in the past. What improved, and what got worse?', category: 'Society', level: 'B2' },
  { id: 't40', title: 'What makes a good neighbour?', prompt: 'Describe what makes someone a good neighbour, with an example.', category: 'Society', level: 'B1' },

  // --- Imagination ----------------------------------------------------------
  { id: 't41', title: 'If you could live in any time period', prompt: 'Which period would you choose, and what would be hard about it?', category: 'Imagination', level: 'B1' },
  { id: 't42', title: 'You have one year and unlimited money', prompt: 'What would you actually do with a free year and no money worries? Be specific.', category: 'Imagination', level: 'B1' },
  { id: 't43', title: 'A letter to yourself in ten years', prompt: 'Write to your future self. What do you hope has happened, and what do you want to warn them about?', category: 'Imagination', level: 'B2' },
  { id: 't44', title: 'You can master one skill instantly', prompt: 'Which skill would you choose, and how would it change your life?', category: 'Imagination', level: 'B1' },

  // --- Exam style -----------------------------------------------------------
  { id: 't45', title: 'Describe a person you admire', prompt: 'Say who they are, how you know them, what they do, and explain why you admire them.', category: 'Exam style', level: 'B1' },
  { id: 't46', title: 'Describe an object that is important to you', prompt: 'Say what it is, where you got it, how you use it, and explain why it matters.', category: 'Exam style', level: 'B1' },
  { id: 't47', title: 'Advantages and disadvantages of remote work', prompt: 'Discuss both sides and give your own conclusion.', category: 'Exam style', level: 'B2' },
  { id: 't48', title: 'Some people think exams should be abolished', prompt: 'Discuss both views and give your own opinion, with reasons and examples.', category: 'Exam style', level: 'C1' },
  { id: 't49', title: 'Describe a time you helped someone', prompt: 'Say what happened, what you did, and how you felt about it afterwards.', category: 'Exam style', level: 'B1' },
  { id: 't50', title: 'To what extent should governments fund the arts?', prompt: 'Present a balanced argument and reach a clear conclusion.', category: 'Exam style', level: 'C1' },
]

export const TOPIC_CATEGORIES = [...new Set(TOPICS.map((t) => t.category))]

export function randomTopic(exclude?: string): Topic {
  const pool = exclude ? TOPICS.filter((t) => t.id !== exclude) : TOPICS
  return pool[Math.floor(Math.random() * pool.length)]
}
