import type { LearningLanguage, Topic } from '@/types'

/**
 * Prompts to practise against. Each one asks for a specific experience or
 * opinion rather than a vague theme, because "describe a place you visited"
 * produces far more usable language than "talk about travel".
 *
 * The French set is written in French rather than translated mechanically: a
 * French learner is asked the question in the language they are practising, so
 * reading the prompt is already part of the exercise.
 */
const EN: Topic[] = [
  // --- Daily life -----------------------------------------------------------
  { id: 't1', language: 'en', title: 'A place you visited recently', prompt: 'Describe a place you went to recently. Who were you with, what did you do, and would you go back?', category: 'Daily life', level: 'A2' },
  { id: 't2', language: 'en', title: 'Your typical morning', prompt: 'Walk me through your morning from waking up to starting your day. What would you change about it?', category: 'Daily life', level: 'A2' },
  { id: 't3', language: 'en', title: 'A meal you love', prompt: 'Describe a meal you really enjoy. What is in it, who makes it best, and why does it matter to you?', category: 'Daily life', level: 'A2' },
  { id: 't4', language: 'en', title: 'Something you bought recently', prompt: 'What did you buy recently? Why did you choose it, and was it worth the money?', category: 'Daily life', level: 'A2' },
  { id: 't5', language: 'en', title: 'How you spend your weekend', prompt: 'Describe a normal weekend for you. Is it restful or busy? What would your ideal weekend look like?', category: 'Daily life', level: 'A2' },
  { id: 't6', language: 'en', title: 'A habit you want to change', prompt: 'Describe a habit you would like to change. Why is it hard, and what have you tried so far?', category: 'Daily life', level: 'B1' },

  // --- Personal story -------------------------------------------------------
  { id: 't7', language: 'en', title: 'A time you were proud of yourself', prompt: 'Tell the story of something you achieved. What made it difficult, and how did you feel afterwards?', category: 'Personal story', level: 'B1' },
  { id: 't8', language: 'en', title: 'A mistake that taught you something', prompt: 'Describe a mistake you made. What happened, and what would you do differently now?', category: 'Personal story', level: 'B1' },
  { id: 't9', language: 'en', title: 'The best day of your life so far', prompt: 'Describe the best day you can remember. Where were you, who was there, and why does it stand out?', category: 'Personal story', level: 'B1' },
  { id: 't10', language: 'en', title: 'Someone who influenced you', prompt: 'Describe a person who changed how you think. What did they do or say, and how did it affect you?', category: 'Personal story', level: 'B1' },
  { id: 't11', language: 'en', title: 'A difficult decision you made', prompt: 'Describe a hard choice you had to make. What were the options, and how did you decide?', category: 'Personal story', level: 'B2' },
  { id: 't12', language: 'en', title: 'A fear you overcame', prompt: 'Describe something you were afraid of and how you dealt with it. Are you still afraid of it?', category: 'Personal story', level: 'B2' },

  // --- Opinion --------------------------------------------------------------
  { id: 't13', language: 'en', title: 'Is social media good or bad for us?', prompt: 'Give your opinion on social media. Support it with at least two reasons and one example from your own life.', category: 'Opinion', level: 'B1' },
  { id: 't14', language: 'en', title: 'Should university be free?', prompt: 'Argue for or against free university education. Consider who pays and who benefits.', category: 'Opinion', level: 'B2' },
  { id: 't15', language: 'en', title: 'Is it better to live in a city or the countryside?', prompt: 'Compare city and countryside life. Which suits you better, and why?', category: 'Opinion', level: 'B1' },
  { id: 't16', language: 'en', title: 'Do we work too much?', prompt: 'Do you think people work too many hours? What would change if the working week were shorter?', category: 'Opinion', level: 'B2' },
  { id: 't17', language: 'en', title: 'Should everyone learn a second language?', prompt: 'Argue your position. What does learning a language give you beyond the language itself?', category: 'Opinion', level: 'B1' },
  { id: 't18', language: 'en', title: 'Is money the main reason people work?', prompt: 'Explain what really motivates people at work, in your view. Use examples.', category: 'Opinion', level: 'B2' },

  // --- Work and study -------------------------------------------------------
  { id: 't19', language: 'en', title: 'Your dream job', prompt: 'Describe the job you would love to have. What would a typical day look like, and what is stopping you?', category: 'Work and study', level: 'A2' },
  { id: 't20', language: 'en', title: 'A skill you are learning', prompt: 'Describe a skill you are working on. How are you learning it, and how will you know you are good at it?', category: 'Work and study', level: 'B1' },
  { id: 't21', language: 'en', title: 'The best way to learn English', prompt: 'What has actually worked for you in learning English? What has not worked?', category: 'Work and study', level: 'B1' },
  { id: 't22', language: 'en', title: 'A teacher you remember', prompt: 'Describe a teacher who made an impression on you, good or bad. What did they do differently?', category: 'Work and study', level: 'B1' },
  { id: 't23', language: 'en', title: 'Working alone or in a team', prompt: 'Which do you prefer and why? Give an example of when the other one worked better.', category: 'Work and study', level: 'B2' },
  { id: 't24', language: 'en', title: 'How you handle pressure', prompt: 'Describe how you deal with deadlines or stress. Give a real example.', category: 'Work and study', level: 'B2' },

  // --- Travel ---------------------------------------------------------------
  { id: 't25', language: 'en', title: 'A country you want to visit', prompt: 'Where do you want to go, and what specifically do you want to do there?', category: 'Travel', level: 'A2' },
  { id: 't26', language: 'en', title: 'A journey that went wrong', prompt: 'Tell the story of a trip where something went wrong. How did it end?', category: 'Travel', level: 'B1' },
  { id: 't27', language: 'en', title: 'Your city, to a visitor', prompt: 'Explain your city to someone who has never been. What should they see, and what should they skip?', category: 'Travel', level: 'B1' },
  { id: 't28', language: 'en', title: 'Travelling alone or with others', prompt: 'Which do you prefer? What do you gain and lose with each?', category: 'Travel', level: 'B2' },

  // --- Technology -----------------------------------------------------------
  { id: 't29', language: 'en', title: 'An app you use every day', prompt: 'Describe an app you rely on. What does it do well, and what frustrates you about it?', category: 'Technology', level: 'A2' },
  { id: 't30', language: 'en', title: 'Will AI take our jobs?', prompt: 'Give your view on AI and work. Which jobs are at risk, and which are safe?', category: 'Technology', level: 'B2' },
  { id: 't31', language: 'en', title: 'Life before smartphones', prompt: 'How was life different before smartphones? Was anything better?', category: 'Technology', level: 'B1' },
  { id: 't32', language: 'en', title: 'A piece of technology you would remove', prompt: 'If you could delete one technology from the world, what would it be and why?', category: 'Technology', level: 'B2' },

  // --- Culture --------------------------------------------------------------
  { id: 't33', language: 'en', title: 'A film or series you recommend', prompt: 'Describe something you watched recently. What is it about, and who would enjoy it?', category: 'Culture', level: 'A2' },
  { id: 't34', language: 'en', title: 'A book that changed your mind', prompt: 'Describe a book that changed how you see something. What was the idea?', category: 'Culture', level: 'B2' },
  { id: 't35', language: 'en', title: 'A tradition in your country', prompt: 'Explain a tradition or celebration to someone from outside your culture.', category: 'Culture', level: 'B1' },
  { id: 't36', language: 'en', title: 'Music that means something to you', prompt: 'Describe a song or artist that matters to you and explain why.', category: 'Culture', level: 'B1' },

  // --- Society --------------------------------------------------------------
  { id: 't37', language: 'en', title: 'The biggest problem in your city', prompt: 'What is the most serious problem where you live? What would you do about it?', category: 'Society', level: 'B2' },
  { id: 't38', language: 'en', title: 'How should we deal with climate change?', prompt: 'What should individuals do, and what should governments do? Are both equally important?', category: 'Society', level: 'B2' },
  { id: 't39', language: 'en', title: 'Is life better now than 50 years ago?', prompt: 'Compare life today with life in the past. What improved, and what got worse?', category: 'Society', level: 'B2' },
  { id: 't40', language: 'en', title: 'What makes a good neighbour?', prompt: 'Describe what makes someone a good neighbour, with an example.', category: 'Society', level: 'B1' },

  // --- Imagination ----------------------------------------------------------
  { id: 't41', language: 'en', title: 'If you could live in any time period', prompt: 'Which period would you choose, and what would be hard about it?', category: 'Imagination', level: 'B1' },
  { id: 't42', language: 'en', title: 'You have one year and unlimited money', prompt: 'What would you actually do with a free year and no money worries? Be specific.', category: 'Imagination', level: 'B1' },
  { id: 't43', language: 'en', title: 'A letter to yourself in ten years', prompt: 'Write to your future self. What do you hope has happened, and what do you want to warn them about?', category: 'Imagination', level: 'B2' },
  { id: 't44', language: 'en', title: 'You can master one skill instantly', prompt: 'Which skill would you choose, and how would it change your life?', category: 'Imagination', level: 'B1' },

  // --- Exam style -----------------------------------------------------------
  { id: 't45', language: 'en', title: 'Describe a person you admire', prompt: 'Say who they are, how you know them, what they do, and explain why you admire them.', category: 'Exam style', level: 'B1' },
  { id: 't46', language: 'en', title: 'Describe an object that is important to you', prompt: 'Say what it is, where you got it, how you use it, and explain why it matters.', category: 'Exam style', level: 'B1' },
  { id: 't47', language: 'en', title: 'Advantages and disadvantages of remote work', prompt: 'Discuss both sides and give your own conclusion.', category: 'Exam style', level: 'B2' },
  { id: 't48', language: 'en', title: 'Some people think exams should be abolished', prompt: 'Discuss both views and give your own opinion, with reasons and examples.', category: 'Exam style', level: 'C1' },
  { id: 't49', language: 'en', title: 'Describe a time you helped someone', prompt: 'Say what happened, what you did, and how you felt about it afterwards.', category: 'Exam style', level: 'B1' },
  { id: 't50', language: 'en', title: 'To what extent should governments fund the arts?', prompt: 'Present a balanced argument and reach a clear conclusion.', category: 'Exam style', level: 'C1' },
]

const FR: Topic[] = [
  // --- Vie quotidienne ------------------------------------------------------
  { id: 'f1', language: 'fr', title: 'Un endroit où vous êtes allé récemment', prompt: 'Décrivez un endroit où vous êtes allé récemment. Avec qui étiez-vous, qu’avez-vous fait, et y retourneriez-vous ?', category: 'Vie quotidienne', level: 'A2' },
  { id: 'f2', language: 'fr', title: 'Votre matinée habituelle', prompt: 'Racontez votre matinée, du réveil jusqu’au début de votre journée. Qu’est-ce que vous changeriez ?', category: 'Vie quotidienne', level: 'A2' },
  { id: 'f3', language: 'fr', title: 'Un plat que vous adorez', prompt: 'Décrivez un plat que vous aimez vraiment. Qu’est-ce qu’il contient, qui le prépare le mieux, et pourquoi compte-t-il pour vous ?', category: 'Vie quotidienne', level: 'A2' },
  { id: 'f4', language: 'fr', title: 'Quelque chose que vous avez acheté récemment', prompt: 'Qu’avez-vous acheté récemment ? Pourquoi l’avez-vous choisi, et est-ce que cela valait le prix ?', category: 'Vie quotidienne', level: 'A2' },
  { id: 'f5', language: 'fr', title: 'Comment vous passez le week-end', prompt: 'Décrivez un week-end normal pour vous. Est-il reposant ou chargé ? À quoi ressemblerait votre week-end idéal ?', category: 'Vie quotidienne', level: 'A2' },
  { id: 'f6', language: 'fr', title: 'Une habitude que vous voulez changer', prompt: 'Décrivez une habitude que vous aimeriez changer. Pourquoi est-ce difficile, et qu’avez-vous déjà essayé ?', category: 'Vie quotidienne', level: 'B1' },

  // --- Histoire personnelle -------------------------------------------------
  { id: 'f7', language: 'fr', title: 'Un moment où vous étiez fier de vous', prompt: 'Racontez quelque chose que vous avez réussi. Qu’est-ce qui était difficile, et comment vous êtes-vous senti après ?', category: 'Histoire personnelle', level: 'B1' },
  { id: 'f8', language: 'fr', title: 'Une erreur qui vous a appris quelque chose', prompt: 'Décrivez une erreur que vous avez faite. Que s’est-il passé, et que feriez-vous différemment aujourd’hui ?', category: 'Histoire personnelle', level: 'B1' },
  { id: 'f9', language: 'fr', title: 'Le plus beau jour de votre vie', prompt: 'Décrivez le meilleur jour dont vous vous souvenez. Où étiez-vous, qui était là, et pourquoi ce jour vous marque-t-il ?', category: 'Histoire personnelle', level: 'B1' },
  { id: 'f10', language: 'fr', title: 'Quelqu’un qui vous a influencé', prompt: 'Décrivez une personne qui a changé votre façon de penser. Qu’a-t-elle fait ou dit, et quel effet cela a-t-il eu ?', category: 'Histoire personnelle', level: 'B1' },
  { id: 'f11', language: 'fr', title: 'Une décision difficile', prompt: 'Décrivez un choix difficile que vous avez dû faire. Quelles étaient les options, et comment avez-vous décidé ?', category: 'Histoire personnelle', level: 'B2' },
  { id: 'f12', language: 'fr', title: 'Une peur que vous avez surmontée', prompt: 'Décrivez quelque chose qui vous faisait peur et comment vous l’avez affronté. En avez-vous encore peur ?', category: 'Histoire personnelle', level: 'B2' },

  // --- Opinion --------------------------------------------------------------
  { id: 'f13', language: 'fr', title: 'Les réseaux sociaux : bons ou mauvais ?', prompt: 'Donnez votre opinion sur les réseaux sociaux. Appuyez-la avec au moins deux raisons et un exemple tiré de votre vie.', category: 'Opinion', level: 'B1' },
  { id: 'f14', language: 'fr', title: 'L’université devrait-elle être gratuite ?', prompt: 'Défendez une position pour ou contre la gratuité des études. Qui paie, et qui en profite ?', category: 'Opinion', level: 'B2' },
  { id: 'f15', language: 'fr', title: 'Vivre en ville ou à la campagne ?', prompt: 'Comparez la vie en ville et à la campagne. Laquelle vous convient le mieux, et pourquoi ?', category: 'Opinion', level: 'B1' },
  { id: 'f16', language: 'fr', title: 'Travaillons-nous trop ?', prompt: 'Pensez-vous que les gens travaillent trop d’heures ? Qu’est-ce qui changerait si la semaine était plus courte ?', category: 'Opinion', level: 'B2' },
  { id: 'f17', language: 'fr', title: 'Faut-il apprendre une deuxième langue ?', prompt: 'Défendez votre position. Qu’est-ce qu’apprendre une langue apporte au-delà de la langue elle-même ?', category: 'Opinion', level: 'B1' },
  { id: 'f18', language: 'fr', title: 'Travaille-t-on surtout pour l’argent ?', prompt: 'Expliquez ce qui motive vraiment les gens au travail, selon vous. Donnez des exemples.', category: 'Opinion', level: 'B2' },

  // --- Travail et études ----------------------------------------------------
  { id: 'f19', language: 'fr', title: 'Le métier de vos rêves', prompt: 'Décrivez le métier que vous aimeriez exercer. À quoi ressemblerait une journée type, et qu’est-ce qui vous en empêche ?', category: 'Travail et études', level: 'A2' },
  { id: 'f20', language: 'fr', title: 'Une compétence que vous apprenez', prompt: 'Décrivez une compétence sur laquelle vous travaillez. Comment l’apprenez-vous, et comment saurez-vous que vous la maîtrisez ?', category: 'Travail et études', level: 'B1' },
  { id: 'f21', language: 'fr', title: 'La meilleure façon d’apprendre le français', prompt: 'Qu’est-ce qui a vraiment marché pour vous dans l’apprentissage du français ? Qu’est-ce qui n’a pas marché ?', category: 'Travail et études', level: 'B1' },
  { id: 'f22', language: 'fr', title: 'Un professeur dont vous vous souvenez', prompt: 'Décrivez un professeur qui vous a marqué, en bien ou en mal. Que faisait-il différemment ?', category: 'Travail et études', level: 'B1' },
  { id: 'f23', language: 'fr', title: 'Travailler seul ou en équipe', prompt: 'Que préférez-vous et pourquoi ? Donnez un exemple où l’autre option a mieux fonctionné.', category: 'Travail et études', level: 'B2' },
  { id: 'f24', language: 'fr', title: 'Comment vous gérez la pression', prompt: 'Décrivez comment vous gérez les délais ou le stress. Donnez un exemple réel.', category: 'Travail et études', level: 'B2' },

  // --- Voyages --------------------------------------------------------------
  { id: 'f25', language: 'fr', title: 'Un pays que vous voulez visiter', prompt: 'Où voulez-vous aller, et que voulez-vous y faire précisément ?', category: 'Voyages', level: 'A2' },
  { id: 'f26', language: 'fr', title: 'Un voyage qui a mal tourné', prompt: 'Racontez un voyage où quelque chose s’est mal passé. Comment cela s’est-il terminé ?', category: 'Voyages', level: 'B1' },
  { id: 'f27', language: 'fr', title: 'Votre ville, pour un visiteur', prompt: 'Présentez votre ville à quelqu’un qui n’y est jamais allé. Que doit-il voir, et que peut-il éviter ?', category: 'Voyages', level: 'B1' },
  { id: 'f28', language: 'fr', title: 'Voyager seul ou accompagné', prompt: 'Que préférez-vous ? Qu’est-ce qu’on gagne et qu’est-ce qu’on perd dans chaque cas ?', category: 'Voyages', level: 'B2' },

  // --- Technologie ----------------------------------------------------------
  { id: 'f29', language: 'fr', title: 'Une application que vous utilisez tous les jours', prompt: 'Décrivez une application dont vous dépendez. Que fait-elle bien, et qu’est-ce qui vous agace ?', category: 'Technologie', level: 'A2' },
  { id: 'f30', language: 'fr', title: 'L’IA va-t-elle prendre nos emplois ?', prompt: 'Donnez votre avis sur l’IA et le travail. Quels métiers sont menacés, et lesquels sont à l’abri ?', category: 'Technologie', level: 'B2' },
  { id: 'f31', language: 'fr', title: 'La vie avant les smartphones', prompt: 'En quoi la vie était-elle différente avant les smartphones ? Y avait-il des choses meilleures ?', category: 'Technologie', level: 'B1' },
  { id: 'f32', language: 'fr', title: 'Une technologie que vous supprimeriez', prompt: 'Si vous pouviez supprimer une technologie du monde, laquelle et pourquoi ?', category: 'Technologie', level: 'B2' },

  // --- Culture --------------------------------------------------------------
  { id: 'f33', language: 'fr', title: 'Un film ou une série à recommander', prompt: 'Décrivez quelque chose que vous avez regardé récemment. De quoi ça parle, et à qui cela plairait-il ?', category: 'Culture', level: 'A2' },
  { id: 'f34', language: 'fr', title: 'Un livre qui a changé votre avis', prompt: 'Décrivez un livre qui a changé votre façon de voir quelque chose. Quelle était l’idée ?', category: 'Culture', level: 'B2' },
  { id: 'f35', language: 'fr', title: 'Une tradition de votre pays', prompt: 'Expliquez une tradition ou une fête à quelqu’un qui vient d’une autre culture.', category: 'Culture', level: 'B1' },
  { id: 'f36', language: 'fr', title: 'Une musique qui compte pour vous', prompt: 'Décrivez une chanson ou un artiste qui compte pour vous et expliquez pourquoi.', category: 'Culture', level: 'B1' },

  // --- Société --------------------------------------------------------------
  { id: 'f37', language: 'fr', title: 'Le plus gros problème de votre ville', prompt: 'Quel est le problème le plus grave là où vous vivez ? Que feriez-vous pour le résoudre ?', category: 'Société', level: 'B2' },
  { id: 'f38', language: 'fr', title: 'Comment agir face au changement climatique ?', prompt: 'Que devraient faire les individus, et que devraient faire les gouvernements ? Est-ce aussi important des deux côtés ?', category: 'Société', level: 'B2' },
  { id: 'f39', language: 'fr', title: 'Vit-on mieux aujourd’hui qu’il y a 50 ans ?', prompt: 'Comparez la vie d’aujourd’hui et celle du passé. Qu’est-ce qui s’est amélioré, et qu’est-ce qui s’est dégradé ?', category: 'Société', level: 'B2' },
  { id: 'f40', language: 'fr', title: 'Qu’est-ce qu’un bon voisin ?', prompt: 'Décrivez ce qui fait un bon voisin, avec un exemple.', category: 'Société', level: 'B1' },

  // --- Imagination ----------------------------------------------------------
  { id: 'f41', language: 'fr', title: 'Si vous pouviez vivre à une autre époque', prompt: 'Quelle époque choisiriez-vous, et qu’est-ce qui serait difficile ?', category: 'Imagination', level: 'B1' },
  { id: 'f42', language: 'fr', title: 'Un an libre et de l’argent sans limite', prompt: 'Que feriez-vous vraiment d’une année libre sans souci d’argent ? Soyez précis.', category: 'Imagination', level: 'B1' },
  { id: 'f43', language: 'fr', title: 'Une lettre à vous-même dans dix ans', prompt: 'Écrivez à votre futur vous. Qu’espérez-vous qu’il se soit passé, et contre quoi voulez-vous le mettre en garde ?', category: 'Imagination', level: 'B2' },
  { id: 'f44', language: 'fr', title: 'Maîtriser une compétence instantanément', prompt: 'Quelle compétence choisiriez-vous, et comment cela changerait-il votre vie ?', category: 'Imagination', level: 'B1' },

  // --- Type examen ----------------------------------------------------------
  { id: 'f45', language: 'fr', title: 'Décrivez une personne que vous admirez', prompt: 'Dites qui elle est, comment vous la connaissez, ce qu’elle fait, et expliquez pourquoi vous l’admirez.', category: 'Type examen', level: 'B1' },
  { id: 'f46', language: 'fr', title: 'Décrivez un objet important pour vous', prompt: 'Dites ce que c’est, d’où il vient, comment vous l’utilisez, et pourquoi il compte.', category: 'Type examen', level: 'B1' },
  { id: 'f47', language: 'fr', title: 'Avantages et inconvénients du télétravail', prompt: 'Discutez les deux côtés et donnez votre conclusion.', category: 'Type examen', level: 'B2' },
  { id: 'f48', language: 'fr', title: 'Faut-il supprimer les examens ?', prompt: 'Discutez les deux points de vue et donnez votre opinion, avec des raisons et des exemples.', category: 'Type examen', level: 'C1' },
  { id: 'f49', language: 'fr', title: 'Une fois où vous avez aidé quelqu’un', prompt: 'Dites ce qui s’est passé, ce que vous avez fait, et ce que vous avez ressenti après.', category: 'Type examen', level: 'B1' },
  { id: 'f50', language: 'fr', title: 'L’État doit-il financer la culture ?', prompt: 'Présentez un argumentaire équilibré et arrivez à une conclusion claire.', category: 'Type examen', level: 'C1' },
]

const TOPICS_BY_LANGUAGE: Record<LearningLanguage, Topic[]> = { en: EN, fr: FR }

export function topicsFor(language: LearningLanguage): Topic[] {
  return TOPICS_BY_LANGUAGE[language]
}

export function topicCategoriesFor(language: LearningLanguage): string[] {
  return [...new Set(topicsFor(language).map((t) => t.category))]
}

export function randomTopic(language: LearningLanguage, exclude?: string): Topic {
  const all = topicsFor(language)
  const pool = exclude ? all.filter((t) => t.id !== exclude) : all
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Used when reopening a saved session, whose topic may be in either language. */
export function findTopic(id: string): Topic | undefined {
  return [...EN, ...FR].find((t) => t.id === id)
}
