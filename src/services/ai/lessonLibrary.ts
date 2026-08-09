import type { ErrorType, LearningLanguage } from '@/types'

export interface LessonTemplate {
  title: string
  body: string
  /** One sentence to remember it by. See Lesson.memoryHook. */
  memoryHook: string
  examples: { wrong: string; right: string; note?: string }[]
  exercises: { question: string; choices: string[]; answerIndex: number; explanation: string }[]
}

/**
 * One teaching template per error type. The generator picks the template that
 * matches the learner's most frequent mistake and attaches the sentence they
 * actually wrote, so the lesson is never generic filler.
 */
const EN_LESSONS: Partial<Record<ErrorType, LessonTemplate>> = {
  'verb-tense': {
    title: 'Choosing the right verb tense',
    memoryHook: 'Time gets marked once. If did, didn’t or can has already marked it, the next verb goes back to plain: didn’t go, never didn’t went.',
    body: 'English marks time on the verb, and each tense has one job.\n\n**Present simple** is for habits and facts: *I work every day.*\n**Past simple** is for finished actions with a finished time: *I worked yesterday.*\n**Present perfect** connects the past to now: *I have worked here for three years.*\n\nThe trap that catches most learners: after **did**, **didn\'t** or a modal like **can**, the verb goes back to its base form. The time is already marked once, so it is not marked twice.',
    examples: [
      { wrong: 'I didn\'t went to work.', right: 'I didn\'t go to work.', note: '"Did" already shows past, so "go" stays in base form.' },
      { wrong: 'Yesterday I have seen a film.', right: 'Yesterday I saw a film.', note: 'A finished time word like "yesterday" needs past simple.' },
      { wrong: 'I am living here since 2020.', right: 'I have lived here since 2020.', note: 'Started in the past, still true now.' },
    ],
    exercises: [
      { question: 'She didn\'t ___ the message.', choices: ['saw', 'see', 'seen', 'seeing'], answerIndex: 1, explanation: 'After "didn\'t" the verb is always the base form: see.' },
      { question: 'Last summer we ___ to Spain.', choices: ['have gone', 'go', 'went', 'are going'], answerIndex: 2, explanation: '"Last summer" is a finished time, so use past simple.' },
      { question: 'I ___ him since 2019.', choices: ['know', 'knew', 'have known', 'am knowing'], answerIndex: 2, explanation: '"Since" + a start point takes present perfect.' },
      { question: 'He can ___ three languages.', choices: ['speaks', 'speak', 'spoke', 'speaking'], answerIndex: 1, explanation: 'After a modal like "can", use the base form.' },
      { question: 'Water ___ at 100 degrees.', choices: ['is boiling', 'boiled', 'boils', 'has boiled'], answerIndex: 2, explanation: 'General facts use the present simple.' },
    ],
  },

  article: {
    title: 'A, an and the',
    memoryHook: 'Trust your ear, not your eye: an hour, a university. The sound picks the article; the spelling never does.',
    body: 'Three questions decide the article.\n\n**Is it the first time you mention it?** Use *a* or *an*: *I saw a dog.*\n**Does the listener already know which one?** Use *the*: *The dog was barking.*\n**Is it a general plural or uncountable idea?** Use no article: *Dogs are loyal. Water is free.*\n\nThe choice between *a* and *an* follows the **sound**, not the letter: *an hour* (silent h), *a university* (sounds like "yu").',
    examples: [
      { wrong: 'I want to be a engineer.', right: 'I want to be an engineer.', note: '"Engineer" starts with a vowel sound.' },
      { wrong: 'I go to the school every day.', right: 'I go to school every day.', note: 'For the general activity, drop "the".' },
      { wrong: 'She is best student.', right: 'She is the best student.', note: 'Superlatives always take "the".' },
    ],
    exercises: [
      { question: 'He waited for ___ hour.', choices: ['a', 'an', 'the', 'no article'], answerIndex: 1, explanation: 'The "h" in hour is silent, so it starts with a vowel sound.' },
      { question: 'She is ___ university student.', choices: ['a', 'an', 'the', 'no article'], answerIndex: 0, explanation: '"University" starts with a "yu" consonant sound.' },
      { question: '___ sun is very bright today.', choices: ['A', 'An', 'The', 'No article'], answerIndex: 2, explanation: 'There is only one sun, so it takes "the".' },
      { question: 'I like ___ music.', choices: ['a', 'an', 'the', 'no article'], answerIndex: 3, explanation: 'A general uncountable idea takes no article.' },
      { question: 'That was ___ best film of the year.', choices: ['a', 'an', 'the', 'no article'], answerIndex: 2, explanation: 'Superlatives take "the".' },
    ],
  },

  preposition: {
    title: 'Prepositions that come as fixed pairs',
    memoryHook: 'Never translate a preposition - learn the pair. Depend on is one word that happens to have a space in it.',
    body: 'Most preposition mistakes are not logic mistakes. Many verbs and adjectives simply come glued to one preposition, and the pair has to be memorised as a single unit.\n\nThe most useful ones: **depend on**, **good at**, **interested in**, **married to**, **responsible for**, **listen to**, **arrive at/in**, **afraid of**.\n\nFor time: **at** a clock time, **on** a day, **in** a month or year. The unit gets bigger as the word gets longer: at 7pm → on Monday → in June.',
    examples: [
      { wrong: 'It depends of the weather.', right: 'It depends on the weather.' },
      { wrong: 'She is good in maths.', right: 'She is good at maths.' },
      { wrong: 'I will see you in Monday.', right: 'I will see you on Monday.', note: 'Days take "on".' },
    ],
    exercises: [
      { question: 'It depends ___ you.', choices: ['of', 'on', 'from', 'to'], answerIndex: 1, explanation: 'The fixed pair is "depend on".' },
      { question: 'He is very good ___ cooking.', choices: ['in', 'on', 'at', 'for'], answerIndex: 2, explanation: 'Skills take "good at".' },
      { question: 'I am interested ___ history.', choices: ['on', 'about', 'for', 'in'], answerIndex: 3, explanation: 'The fixed pair is "interested in".' },
      { question: 'The meeting is ___ 3 o\'clock.', choices: ['at', 'on', 'in', 'to'], answerIndex: 0, explanation: 'Clock times take "at".' },
      { question: 'She is responsible ___ the team.', choices: ['of', 'about', 'for', 'to'], answerIndex: 2, explanation: 'The fixed pair is "responsible for".' },
    ],
  },

  'subject-verb-agreement': {
    title: 'Making the verb match the subject',
    memoryHook: 'If you could say he, she or it, hand the s to the verb. Everybody else keeps it.',
    body: 'In the present simple, **he**, **she** and **it** add **-s** to the verb. Everything else does not.\n\n*I work / you work / **he works** / we work / they work*\n\nSpelling details: verbs ending in -ch, -sh, -ss, -x or -o add **-es** (*watches, goes*), and a consonant + -y becomes **-ies** (*study → studies*).\n\nWatch out for words that look singular but are plural: **people**, **children**, **police** all take *are*.',
    examples: [
      { wrong: 'He go to work by bus.', right: 'He goes to work by bus.' },
      { wrong: 'People is very kind here.', right: 'People are very kind here.', note: '"People" is already plural.' },
      { wrong: 'She study every evening.', right: 'She studies every evening.', note: 'Consonant + y becomes -ies.' },
    ],
    exercises: [
      { question: 'My brother ___ in London.', choices: ['live', 'lives', 'living', 'is live'], answerIndex: 1, explanation: '"He/she/it" adds -s in the present simple.' },
      { question: 'The children ___ playing outside.', choices: ['is', 'was', 'are', 'has'], answerIndex: 2, explanation: '"Children" is plural, so it takes "are".' },
      { question: 'She ___ television every night.', choices: ['watch', 'watchs', 'watches', 'watching'], answerIndex: 2, explanation: 'Verbs ending in -ch add -es.' },
      { question: 'People ___ different opinions.', choices: ['has', 'have', 'is having', 'having'], answerIndex: 1, explanation: '"People" is plural, so it takes "have".' },
      { question: 'It ___ a lot in winter.', choices: ['rain', 'rains', 'raining', 'are raining'], answerIndex: 1, explanation: '"It" takes the -s form.' },
    ],
  },

  plural: {
    title: 'Countable, uncountable and irregular plurals',
    memoryHook: 'If you cannot put a number in front of it, it cannot take an s. Three advices is as impossible as three waters.',
    body: 'Some English nouns cannot be counted, so they never take **-s** and never take *a/an*: **information, advice, furniture, homework, knowledge, luggage, news, research, equipment**.\n\nTo count them, add a container word: *a piece of advice*, *two pieces of information*.\n\nA few nouns are already plural and must not take another -s: **children**, **people**, **men**, **women**, **feet**, **teeth**.\n\nAnd use **many** for countable things, **much** for uncountable: *many books*, *much water*.',
    examples: [
      { wrong: 'He gave me some advices.', right: 'He gave me some advice.' },
      { wrong: 'I need more informations.', right: 'I need more information.' },
      { wrong: 'There were much people there.', right: 'There were many people there.' },
    ],
    exercises: [
      { question: 'Can you give me some ___?', choices: ['advices', 'advice', 'an advice', 'advice\'s'], answerIndex: 1, explanation: '"Advice" is uncountable: no -s, no "an".' },
      { question: 'How ___ people came?', choices: ['much', 'many', 'lot', 'more'], answerIndex: 1, explanation: '"People" is countable, so use "many".' },
      { question: 'I have three ___ of luggage.', choices: ['pieces', 'piece', 'luggages', 'many'], answerIndex: 0, explanation: 'Uncountable nouns are counted with a container word.' },
      { question: 'The ___ are at school.', choices: ['childrens', 'childs', 'children', 'child'], answerIndex: 2, explanation: '"Children" is already the plural of "child".' },
      { question: 'There isn\'t ___ water left.', choices: ['many', 'much', 'a lot', 'few'], answerIndex: 1, explanation: '"Water" is uncountable, so use "much".' },
    ],
  },

  'word-order': {
    title: 'Where each word goes in the sentence',
    memoryHook: 'English keeps its meaning in the seating plan, not in the endings. Subject, verb, object - swap them and you swap who did what.',
    body: 'English word order is strict because it carries the meaning that other languages carry with endings.\n\nThe backbone is **Subject → Verb → Object**: *I (S) like (V) coffee (O).*\n\nAdjectives go **before** the noun: *a red car*, never *a car red*.\n\nAdverbs of frequency (always, often, never) go **before** the main verb but **after** "be": *She always works. She is always late.*\n\nAnd in a question, the subject and the auxiliary swap: *You are ready → Are you ready?* But in an indirect question they swap back: *I wonder if you are ready.*',
    examples: [
      { wrong: 'I like very much this book.', right: 'I like this book very much.', note: 'Do not split the verb from its object.' },
      { wrong: 'She speaks fluently English.', right: 'She speaks English fluently.', note: 'The object comes before the adverb.' },
      { wrong: 'Do you know where is the station?', right: 'Do you know where the station is?', note: 'Indirect question keeps normal order.' },
    ],
    exercises: [
      { question: 'Which is correct?', choices: ['I drink always coffee.', 'I always drink coffee.', 'Always I drink coffee.', 'I drink coffee always.'], answerIndex: 1, explanation: 'Frequency adverbs go before the main verb.' },
      { question: 'Which is correct?', choices: ['She is late always.', 'She always is late.', 'She is always late.', 'Always she is late.'], answerIndex: 2, explanation: 'After "be", the frequency adverb comes second.' },
      { question: 'Which is correct?', choices: ['He speaks English well.', 'He speaks well English.', 'He well speaks English.', 'Well he speaks English.'], answerIndex: 0, explanation: 'Object first, then the adverb.' },
      { question: 'Which is correct?', choices: ['I have a car red.', 'I have a red car.', 'I red have a car.', 'A red I have car.'], answerIndex: 1, explanation: 'Adjectives go before the noun in English.' },
      { question: 'Which is correct?', choices: ['Can you tell me where is it?', 'Can you tell me where it is?', 'Can you tell where is it me?', 'Can you me tell where is it?'], answerIndex: 1, explanation: 'Indirect questions use normal subject-verb order.' },
    ],
  },

  spelling: {
    title: 'Spelling traps worth memorising',
    memoryHook: 'A lot is two words, always. If whole fits in the middle - a whole lot - it was never one word.',
    body: 'A short list causes most spelling errors.\n\n**Always two words:** a lot, in fact, of course, no one.\n**Always capital:** the pronoun **I**, anywhere in the sentence.\n**Doubling:** a short stressed vowel doubles the consonant before -ing or -ed: *stop → stopping*, *plan → planned*.\n**-y → -ie:** *study → studied*, *happy → happier*.\n\nAnd the classic confusions: *their / there / they\'re*, *your / you\'re*, *its / it\'s*.',
    examples: [
      { wrong: 'i think alot about it.', right: 'I think a lot about it.' },
      { wrong: 'Their going to the shop.', right: 'They\'re going to the shop.', note: '"They\'re" = they are.' },
      { wrong: 'He stoped the car.', right: 'He stopped the car.', note: 'Short stressed vowel doubles the consonant.' },
    ],
    exercises: [
      { question: 'Which is correct?', choices: ['alot', 'a lot', 'allot', 'alott'], answerIndex: 1, explanation: '"A lot" is always two words.' },
      { question: '___ going to be late.', choices: ['Their', 'There', 'They\'re', 'Theyre'], answerIndex: 2, explanation: '"They\'re" is short for "they are".' },
      { question: 'The dog wagged ___ tail.', choices: ['it\'s', 'its', 'its\'', 'it is'], answerIndex: 1, explanation: '"Its" without an apostrophe is the possessive.' },
      { question: 'He ___ the ball yesterday.', choices: ['stoped', 'stopped', 'stopeed', 'stopd'], answerIndex: 1, explanation: 'Short stressed vowel doubles the final consonant.' },
      { question: 'She ___ hard for the exam.', choices: ['studyed', 'studed', 'studied', 'studdied'], answerIndex: 2, explanation: 'Consonant + y becomes -ied.' },
    ],
  },

  collocation: {
    title: 'Words that belong together',
    memoryHook: 'Perfect grammar can still sound wrong. You make a mistake but you do your homework: no reason, just what the language chose.',
    body: 'A collocation is a pair of words that native speakers always use together. The grammar of an alternative may be perfect and it will still sound wrong.\n\nYou **take** a photo, **make** a decision, **do** homework, **have** breakfast, **pay** attention, **tell** the truth.\n\nThe hardest three are **make**, **do** and **take**:\n**make** = create something (make a cake, make a mistake, make a decision)\n**do** = perform an activity (do homework, do the washing, do business)\n**take** = receive or carry (take a photo, take a break, take the bus)',
    examples: [
      { wrong: 'Can you make a photo of us?', right: 'Can you take a photo of us?' },
      { wrong: 'I must do a decision today.', right: 'I must make a decision today.' },
      { wrong: 'She made her homework.', right: 'She did her homework.' },
    ],
    exercises: [
      { question: 'Can you ___ a photo?', choices: ['make', 'do', 'take', 'give'], answerIndex: 2, explanation: 'You "take" a photo.' },
      { question: 'I need to ___ a decision.', choices: ['do', 'make', 'take', 'have'], answerIndex: 1, explanation: 'You "make" a decision.' },
      { question: 'He ___ his homework every night.', choices: ['makes', 'takes', 'does', 'gives'], answerIndex: 2, explanation: 'You "do" homework.' },
      { question: 'Please ___ attention.', choices: ['make', 'do', 'give', 'pay'], answerIndex: 3, explanation: 'You "pay" attention.' },
      { question: 'Let\'s ___ a break.', choices: ['make', 'take', 'do', 'have a'], answerIndex: 1, explanation: 'You "take" a break.' },
    ],
  },

  punctuation: {
    title: 'Punctuation that changes meaning',
    memoryHook: 'The apostrophe has exactly two jobs: a missing letter, or someone owning something. Its owns. It’s is short for it is.',
    body: 'Every sentence starts with a **capital letter** and ends with **. ! or ?**\n\nThe **apostrophe** does two jobs, and only two: it shows a missing letter (*do not → don\'t*) or possession (*Sara\'s book*). It is never used to make a plural.\n\nA **comma** separates items in a list and marks off an introductory phrase: *After work, I went home.* It cannot join two full sentences on its own - that needs a full stop, a semicolon, or a word like *and* or *but*.',
    examples: [
      { wrong: 'i went home. it was late.', right: 'I went home. It was late.' },
      { wrong: 'I like apple\'s and orange\'s.', right: 'I like apples and oranges.', note: 'Plurals never take an apostrophe.' },
      { wrong: 'It was raining, we stayed inside.', right: 'It was raining, so we stayed inside.', note: 'A comma alone cannot join two sentences.' },
    ],
    exercises: [
      { question: 'Which is correct?', choices: ['Its raining today.', 'It\'s raining today.', 'Its\' raining today.', 'It raining today.'], answerIndex: 1, explanation: '"It\'s" = it is.' },
      { question: 'Which is correct?', choices: ['I bought three book\'s.', 'I bought three books.', 'I bought three books\'.', 'I bought three book.'], answerIndex: 1, explanation: 'Plurals take no apostrophe.' },
      { question: 'Which is correct?', choices: ['This is Sarahs car.', 'This is Sarah\'s car.', 'This is Sarahs\' car.', 'This is Sarah car.'], answerIndex: 1, explanation: 'Singular possession takes apostrophe + s.' },
      { question: 'Which is correct?', choices: ['After dinner we watched a film.', 'After dinner, we watched a film.', 'Both are acceptable.', 'Neither is correct.'], answerIndex: 2, explanation: 'The comma after a short introductory phrase is optional.' },
      { question: 'Which correctly joins two sentences?', choices: ['I was tired, I went to bed.', 'I was tired I went to bed.', 'I was tired, so I went to bed.', 'I was tired so, I went to bed.'], answerIndex: 2, explanation: 'A joining word plus a comma links two full sentences.' },
    ],
  },

  'word-choice': {
    title: 'Choosing the word that means what you mean',
    memoryHook: 'You say something, but you tell someone. If a person comes straight after the verb, it is tell.',
    body: 'Some pairs are close in meaning but not interchangeable, and some are simply false friends from your first language.\n\n**say / tell** — you *say something*, you *tell someone*: *He said hello. He told me a story.*\n**make / do** — make creates, do performs.\n**borrow / lend** — you *borrow from*, you *lend to*.\n**than / then** — than compares, then is time.\n\nAnd age uses **be**, not **have**: *I am 25 years old*, never *I have 25 years*.',
    examples: [
      { wrong: 'He said me the truth.', right: 'He told me the truth.', note: '"Tell" takes a person directly.' },
      { wrong: 'I have 30 years old.', right: 'I am 30 years old.' },
      { wrong: 'This is more cheap then that.', right: 'This is cheaper than that.' },
    ],
    exercises: [
      { question: 'She ___ me she was tired.', choices: ['said', 'told', 'spoke', 'talked'], answerIndex: 1, explanation: '"Tell" is followed directly by the person.' },
      { question: 'He ___ that he was busy.', choices: ['told', 'said', 'spoke', 'talked'], answerIndex: 1, explanation: '"Say" is used without a person object here.' },
      { question: 'My sister ___ 20 years old.', choices: ['has', 'have', 'is', 'was being'], answerIndex: 2, explanation: 'English uses "be" for age.' },
      { question: 'Can I ___ your pen?', choices: ['lend', 'borrow', 'rent', 'give'], answerIndex: 1, explanation: 'You borrow from someone; they lend to you.' },
      { question: 'This one is better ___ that one.', choices: ['then', 'than', 'that', 'as'], answerIndex: 1, explanation: '"Than" is used for comparisons.' },
    ],
  },

  other: {
    title: 'Polishing what you already do well',
    memoryHook: 'Sounding fluent is not more grammar, it is shorter sentences and the ordinary word. When a sentence feels heavy, cut it in two.',
    body: 'Your sentence was understandable, but a small change makes it sound more natural to a native speaker.\n\nThe fastest way to sound fluent is not more grammar. It is **shorter sentences**, **stronger verbs**, and **fewer filler words**.\n\nCompare: *I made a decision to do an improvement of my English* → *I decided to improve my English.* Same meaning, half the words, twice as clear.',
    examples: [
      { wrong: 'I made a decision to go.', right: 'I decided to go.', note: 'Use the strong verb instead of verb + noun.' },
      { wrong: 'Due to the fact that it rained...', right: 'Because it rained...' },
      { wrong: 'In my opinion, I think that...', right: 'I think...', note: 'Say it once.' },
    ],
    exercises: [
      { question: 'Which sounds most natural?', choices: ['I made a decision to leave.', 'I decided to leave.', 'I did a decision to leave.', 'I took decision to leave.'], answerIndex: 1, explanation: 'The single strong verb is more natural.' },
      { question: 'Which is most concise?', choices: ['Due to the fact that', 'Because', 'On account of the fact that', 'In view of the fact that'], answerIndex: 1, explanation: '"Because" says the same thing in one word.' },
      { question: 'Which sounds most natural?', choices: ['In my opinion I think it is good.', 'I think it is good.', 'My opinion I think good.', 'In my thinking opinion it is good.'], answerIndex: 1, explanation: 'Do not say the same idea twice.' },
      { question: 'Which is stronger?', choices: ['She gave an explanation of the plan.', 'She explained the plan.', 'She made an explanation of the plan.', 'She did explaining of the plan.'], answerIndex: 1, explanation: 'Use the verb directly.' },
      { question: 'Which is clearest?', choices: ['At this point in time', 'Now', 'In the current moment of time', 'At the present time period'], answerIndex: 1, explanation: 'One clear word beats four vague ones.' },
    ],
  },
}

/**
 * The French lessons are written for French, not translated from the English
 * ones. Two of them have no English counterpart at all - gender agreement and
 * accents are the mistakes that actually dominate French writing, and neither
 * exists as a category in English.
 */
const FR_LESSONS: Partial<Record<ErrorType, LessonTemplate>> = {
  'gender-agreement': {
    title: 'L’accord en genre et en nombre',
    memoryHook: 'L’adjectif suit le nom comme son ombre : si le nom passe au féminin ou au pluriel, l’adjectif suit sans discuter.',
    body: 'En français, l’adjectif s’accorde avec le nom : il change de forme selon que le nom est masculin ou féminin, singulier ou pluriel.\n\n**Règle de base** : féminin → on ajoute **-e**, pluriel → on ajoute **-s**.\n*un petit chat → une petite chatte → des petits chats → des petites chattes*\n\nLe participe passé avec **être** s’accorde aussi avec le sujet : *elle est partie*, *ils sont partis*.\n\nAvec **avoir**, il ne s’accorde pas avec le sujet — sauf si le complément d’objet direct est placé **avant** le verbe : *la lettre que j’ai écrite*.',
    examples: [
      { wrong: 'une maison blanc', right: 'une maison blanche', note: '« Maison » est féminin, donc l’adjectif prend la forme féminine.' },
      { wrong: 'Elle est allé au marché.', right: 'Elle est allée au marché.', note: 'Avec « être », le participe s’accorde avec le sujet.' },
      { wrong: 'Les livres sont intéressant.', right: 'Les livres sont intéressants.', note: 'Sujet pluriel, adjectif pluriel.' },
    ],
    exercises: [
      { question: 'C’est une ___ idée.', choices: ['bon', 'bonne', 'bons', 'bonnes'], answerIndex: 1, explanation: '« Idée » est féminin singulier : bonne.' },
      { question: 'Elles sont ___ hier.', choices: ['arrivé', 'arrivés', 'arrivée', 'arrivées'], answerIndex: 3, explanation: 'Avec « être », accord avec le sujet féminin pluriel.' },
      { question: 'Des voitures ___.', choices: ['neuf', 'neufs', 'neuve', 'neuves'], answerIndex: 3, explanation: '« Voitures » est féminin pluriel : neuves.' },
      { question: 'Il a acheté une table ___.', choices: ['rond', 'ronde', 'ronds', 'rondes'], answerIndex: 1, explanation: '« Table » est féminin singulier : ronde.' },
      { question: 'La lettre que j’ai ___.', choices: ['écrit', 'écrite', 'écrits', 'écrites'], answerIndex: 1, explanation: 'Le COD « la lettre » est avant le verbe, donc accord au féminin singulier.' },
    ],
  },

  accent: {
    title: 'Les accents qui changent le sens',
    memoryHook: 'Remplacez par « avait » : si la phrase tient debout, c’est a sans accent ; sinon, c’est à.',
    body: 'En français, un accent n’est pas une décoration : il change la prononciation et parfois le mot entier.\n\n**a / à** — *a* est le verbe avoir, *à* est une préposition : *Il **a** faim. Il va **à** Paris.*\n**ou / où** — *ou* propose un choix, *où* indique un lieu : *Café **ou** thé ? **Où** es-tu ?*\n**la / là** — *la* est un article, *là* indique un endroit.\n\nL’accent aigu **é** se prononce fermé (*été*), l’accent grave **è** se prononce ouvert (*mère*). La terminaison **-er** de l’infinitif se prononce comme *-é*, ce qui explique la confusion entre *manger* et *mangé*.',
    examples: [
      { wrong: 'Il va a la maison.', right: 'Il va à la maison.', note: '« à » préposition prend un accent grave.' },
      { wrong: 'Ou est mon téléphone ?', right: 'Où est mon téléphone ?', note: '« où » de lieu prend un accent grave.' },
      { wrong: 'J’ai manger une pomme.', right: 'J’ai mangé une pomme.', note: 'Après « ai », c’est le participe passé en -é, pas l’infinitif.' },
    ],
    exercises: [
      { question: 'Il ___ trois frères.', choices: ['à', 'a', 'as', 'ah'], answerIndex: 1, explanation: '« a » est le verbe avoir, sans accent.' },
      { question: '___ habites-tu ?', choices: ['Ou', 'Où', 'Oû', 'Ouh'], answerIndex: 1, explanation: '« Où » de lieu prend l’accent grave.' },
      { question: 'Je vais ___ l’école.', choices: ['a', 'à', 'as', 'ah'], answerIndex: 1, explanation: 'Préposition de lieu : à.' },
      { question: 'Nous avons ___ le film.', choices: ['regarder', 'regardé', 'regardez', 'regardais'], answerIndex: 1, explanation: 'Après l’auxiliaire, participe passé : regardé.' },
      { question: 'Elle veut ___ ce soir.', choices: ['sortie', 'sorti', 'sortir', 'sortez'], answerIndex: 2, explanation: 'Après « veut », on met l’infinitif : sortir.' },
    ],
  },

  'verb-tense': {
    title: 'Choisir le bon temps du verbe',
    memoryHook: 'L’imparfait, c’est le décor ; le passé composé, c’est ce qui arrive dedans. Il pleuvait quand je suis sorti.',
    body: 'Le français distingue nettement deux passés, et c’est là que se joue la plupart des erreurs.\n\n**Passé composé** : une action terminée, un événement précis. *Hier, j’**ai mangé** au restaurant.*\n**Imparfait** : une description, une habitude, un décor. *Quand j’**étais** petit, je **mangeais** chez ma grand-mère.*\n\nUn bon test : si on peut dire « et puis », c’est le passé composé. Si on décrit comment c’était, c’est l’imparfait.\n\nLe **futur proche** (*je vais partir*) est plus courant à l’oral que le futur simple (*je partirai*).',
    examples: [
      { wrong: 'Hier je mangeais au restaurant à midi.', right: 'Hier j’ai mangé au restaurant à midi.', note: 'Un moment précis et terminé : passé composé.' },
      { wrong: 'Quand j’ai été petit, j’ai joué au foot.', right: 'Quand j’étais petit, je jouais au foot.', note: 'Une habitude dans le passé : imparfait.' },
      { wrong: 'Je suis allé à Paris depuis trois ans.', right: 'Je vis à Paris depuis trois ans.', note: '« Depuis » + situation encore vraie : présent.' },
    ],
    exercises: [
      { question: 'Hier, il ___ son ami.', choices: ['voyait', 'a vu', 'voit', 'verra'], answerIndex: 1, explanation: 'Action ponctuelle et terminée : passé composé.' },
      { question: 'Chaque été, nous ___ à la mer.', choices: ['sommes allés', 'allions', 'irons', 'allons'], answerIndex: 1, explanation: 'Habitude passée : imparfait.' },
      { question: 'Il ___ ici depuis 2019.', choices: ['a travaillé', 'travaillait', 'travaille', 'travaillera'], answerIndex: 2, explanation: '« Depuis » + action qui continue : présent.' },
      { question: 'Demain, je ___ mes amis.', choices: ['ai vu', 'voyais', 'vais voir', 'voyais'], answerIndex: 2, explanation: 'Futur proche pour un projet certain.' },
      { question: 'Il faisait beau et soudain il ___.', choices: ['pleuvait', 'a plu', 'pleut', 'pleuvra'], answerIndex: 1, explanation: '« Soudain » marque une rupture : passé composé.' },
    ],
  },

  article: {
    title: 'Les articles : le, la, les, un, une, du',
    memoryHook: 'En français, presque rien ne sort tout nu. Là où l’anglais dit I like coffee, le français met le café.',
    body: 'Le français met un article presque partout où l’anglais le supprime.\n\n**Défini** (le, la, les) : une chose connue, ou une généralité. *J’aime **le** café.*\n**Indéfini** (un, une, des) : une chose parmi d’autres. *J’ai bu **un** café.*\n**Partitif** (du, de la, des) : une quantité non comptée. *Je bois **du** café.*\n\nAprès une négation, l’article indéfini et le partitif deviennent **de** : *Je n’ai pas **de** café.*\n\nEt les articles se contractent : *à + le = **au***, *de + le = **du***.',
    examples: [
      { wrong: 'J’aime café.', right: 'J’aime le café.', note: 'Une généralité prend l’article défini.' },
      { wrong: 'Je n’ai pas du pain.', right: 'Je n’ai pas de pain.', note: 'Après la négation, le partitif devient « de ».' },
      { wrong: 'Je vais à le cinéma.', right: 'Je vais au cinéma.', note: 'à + le se contracte en « au ».' },
    ],
    exercises: [
      { question: 'Je voudrais ___ eau, s’il vous plaît.', choices: ['de', 'de l’', 'le', 'un'], answerIndex: 1, explanation: 'Quantité non comptée devant une voyelle : de l’.' },
      { question: 'Il joue ___ piano.', choices: ['de le', 'du', 'le', 'à le'], answerIndex: 1, explanation: 'jouer de + le = du.' },
      { question: 'Elle n’a pas ___ frères.', choices: ['des', 'de', 'les', 'du'], answerIndex: 1, explanation: 'Après la négation : de.' },
      { question: 'Nous allons ___ plage.', choices: ['à le', 'au', 'à la', 'du'], answerIndex: 2, explanation: '« Plage » est féminin : à la.' },
      { question: '___ enfants jouent dehors.', choices: ['Le', 'La', 'Les', 'Un'], answerIndex: 2, explanation: 'Pluriel défini : les.' },
    ],
  },

  'subject-verb-agreement': {
    title: 'Conjuguer le verbe avec son sujet',
    memoryHook: 'Parle, parles et parlent se prononcent pareil : votre oreille ne vous sauvera pas, seul le sujet décide de la fin.',
    body: 'Chaque personne a sa terminaison, et beaucoup se prononcent pareil sans s’écrire pareil : *je parl**e***, *tu parl**es***, *il parl**e***, *ils parl**ent*** se disent tous de la même façon.\n\nC’est pour cela que l’erreur passe inaperçue à l’oral et saute aux yeux à l’écrit.\n\n**Verbes en -er** : -e, -es, -e, -ons, -ez, -ent.\n**être** : suis, es, est, sommes, êtes, sont.\n**avoir** : ai, as, a, avons, avez, ont.\n**aller** : vais, vas, va, allons, allez, vont.\n\nQuand le sujet est éloigné du verbe, revenez au sujet réel : *Les enfants de mon voisin **jouent*** — le sujet est *les enfants*, pas *mon voisin*.',
    examples: [
      { wrong: 'Ils mange à midi.', right: 'Ils mangent à midi.', note: '3e personne du pluriel : -ent.' },
      { wrong: 'Tu es allé ? Non, je suis pas allé.', right: 'Tu es allé ? Non, je ne suis pas allé.', note: 'La négation garde « ne » à l’écrit.' },
      { wrong: 'Nous avons mangez.', right: 'Nous avons mangé.', note: '« -ez » est la terminaison de « vous », pas du participe.' },
    ],
    exercises: [
      { question: 'Nous ___ au cinéma.', choices: ['allons', 'allez', 'vont', 'va'], answerIndex: 0, explanation: 'nous → allons.' },
      { question: 'Elles ___ contentes.', choices: ['est', 'es', 'sont', 'sommes'], answerIndex: 2, explanation: 'elles → sont.' },
      { question: 'Tu ___ raison.', choices: ['a', 'as', 'ai', 'ont'], answerIndex: 1, explanation: 'tu → as.' },
      { question: 'Mon frère et moi ___ partis.', choices: ['sommes', 'sont', 'est', 'êtes'], answerIndex: 0, explanation: '« mon frère et moi » = nous → sommes.' },
      { question: 'Les élèves de la classe ___ attentifs.', choices: ['est', 'sont', 'es', 'sommes'], answerIndex: 1, explanation: 'Le sujet est « les élèves » : sont.' },
    ],
  },

  preposition: {
    title: 'Les prépositions de lieu et de temps',
    memoryHook: 'Les prépositions s’apprennent par blocs, jamais par traduction : en France, au Japon, aux États-Unis.',
    body: 'Les prépositions ne se traduisent presque jamais mot à mot. Elles s’apprennent par blocs.\n\n**Pays** : *en* France (féminin), *au* Japon (masculin), *aux* États-Unis (pluriel).\n**Villes** : *à* Paris.\n**Temps** : *depuis* (encore vrai), *pendant* (durée finie), *il y a* (moment passé).\n*Je vis ici **depuis** 2020. J’ai vécu à Lyon **pendant** deux ans. Je suis arrivé **il y a** un mois.*\n\nEt certains verbes imposent leur préposition : *penser **à***, *parler **de***, *commencer **à***, *essayer **de***.',
    examples: [
      { wrong: 'Je vais à France.', right: 'Je vais en France.', note: 'Pays féminin : en.' },
      { wrong: 'J’habite ici depuis deux ans en arrière.', right: 'J’habite ici depuis deux ans.', note: '« depuis » suffit.' },
      { wrong: 'Je pense de toi.', right: 'Je pense à toi.', note: 'Le verbe « penser » prend « à » pour une personne.' },
    ],
    exercises: [
      { question: 'Il travaille ___ Japon.', choices: ['en', 'à', 'au', 'dans'], answerIndex: 2, explanation: 'Pays masculin : au.' },
      { question: 'Nous habitons ___ Lyon.', choices: ['en', 'à', 'au', 'dans le'], answerIndex: 1, explanation: 'Ville : à.' },
      { question: 'Je l’ai vu ___ trois jours.', choices: ['depuis', 'pendant', 'il y a', 'dans'], answerIndex: 2, explanation: 'Un moment passé précis : il y a.' },
      { question: 'Elle rêve ___ voyager.', choices: ['à', 'de', 'en', 'pour'], answerIndex: 1, explanation: 'rêver de + infinitif.' },
      { question: 'Il a plu ___ toute la nuit.', choices: ['depuis', 'pendant', 'il y a', 'dès'], answerIndex: 1, explanation: 'Durée terminée : pendant.' },
    ],
  },

  'word-order': {
    title: 'L’ordre des mots en français',
    memoryHook: 'En français, l’adjectif marche derrière le nom : une voiture rouge, jamais une rouge voiture.',
    body: 'L’ordre de base est **Sujet → Verbe → Complément**, comme en anglais. Trois choses le distinguent.\n\n**L’adjectif se place après le nom** dans la plupart des cas : *une voiture rouge*, pas *une rouge voiture*. Quelques adjectifs courts et courants passent devant : *un **grand** homme*, *une **belle** journée*, *un **petit** problème*.\n\n**Le pronom complément passe avant le verbe** : *Je **le** vois*, pas *Je vois le*.\n\n**La négation encadre le verbe** : *Je **ne** mange **pas***. Aux temps composés, elle encadre l’auxiliaire : *Je **n’**ai **pas** mangé*.',
    examples: [
      { wrong: 'une rouge voiture', right: 'une voiture rouge', note: 'La couleur se place après le nom.' },
      { wrong: 'Je vois le souvent.', right: 'Je le vois souvent.', note: 'Le pronom passe avant le verbe.' },
      { wrong: 'Je ai pas mangé.', right: 'Je n’ai pas mangé.', note: 'La négation encadre l’auxiliaire.' },
    ],
    exercises: [
      { question: 'Quelle phrase est correcte ?', choices: ['C’est une intéressante histoire.', 'C’est une histoire intéressante.', 'C’est intéressante une histoire.', 'C’est une histoire intéressant.'], answerIndex: 1, explanation: 'L’adjectif long se place après le nom.' },
      { question: 'Quelle phrase est correcte ?', choices: ['Je connais la.', 'Je la connais.', 'Je connais elle.', 'La je connais.'], answerIndex: 1, explanation: 'Le pronom complément précède le verbe.' },
      { question: 'Quelle phrase est correcte ?', choices: ['Il ne pas vient.', 'Il vient pas ne.', 'Il ne vient pas.', 'Il pas ne vient.'], answerIndex: 2, explanation: 'ne + verbe + pas.' },
      { question: 'Quelle phrase est correcte ?', choices: ['un homme grand et gentil', 'un grand et gentil homme', 'un grand homme gentil', 'Les trois se disent selon le sens.'], answerIndex: 3, explanation: '« Grand » change de sens selon sa place ; les formes existent toutes.' },
      { question: 'Quelle phrase est correcte ?', choices: ['Je n’ai pas le vu.', 'Je ne l’ai pas vu.', 'Je ne l’ai vu pas.', 'Je l’ai ne pas vu.'], answerIndex: 1, explanation: 'Pronom avant l’auxiliaire, négation autour de l’auxiliaire.' },
    ],
  },

  plural: {
    title: 'Former le pluriel',
    memoryHook: 'Le s du pluriel ne s’entend pas. C’est le petit mot devant - un ou des - qui dit combien il y en a.',
    body: 'Le pluriel régulier ajoute un **-s** qui ne se prononce pas : *un livre → des livres*.\n\nLes exceptions se rangent par terminaison :\n**-al → -aux** : *un journal → des journaux*, *un cheval → des chevaux*.\n**-eau, -au, -eu → -x** : *un bateau → des bateaux*, *un jeu → des jeux*.\n**-s, -x, -z** : ne changent pas : *un pays → des pays*.\n\nComme le *-s* est muet, c’est l’article qui s’entend : *le livre* / *les livres*. À l’écrit, il faut accorder tout ce qui suit.',
    examples: [
      { wrong: 'des journals', right: 'des journaux', note: '-al devient -aux.' },
      { wrong: 'des bateaus', right: 'des bateaux', note: '-eau prend un -x.' },
      { wrong: 'des pays différent', right: 'des pays différents', note: 'L’adjectif s’accorde même si le nom ne change pas.' },
    ],
    exercises: [
      { question: 'Le pluriel de « animal » est :', choices: ['animals', 'animaux', 'animales', 'animaus'], answerIndex: 1, explanation: '-al → -aux.' },
      { question: 'Le pluriel de « gâteau » est :', choices: ['gâteaus', 'gâteaux', 'gâteauz', 'gâteaues'], answerIndex: 1, explanation: '-eau → -eaux.' },
      { question: 'Le pluriel de « prix » est :', choices: ['prixs', 'prixes', 'prix', 'pris'], answerIndex: 2, explanation: 'Les mots en -x ne changent pas.' },
      { question: 'Le pluriel de « travail » est :', choices: ['travails', 'travaux', 'travailles', 'travaus'], answerIndex: 1, explanation: 'Pluriel irrégulier : travaux.' },
      { question: 'Le pluriel de « œil » est :', choices: ['œils', 'yeux', 'œilles', 'oeuils'], answerIndex: 1, explanation: 'Pluriel totalement irrégulier : yeux.' },
    ],
  },

  spelling: {
    title: 'Les pièges d’orthographe courants',
    memoryHook: 'Ce montre du doigt, se revient vers le sujet. Si vous pouvez ajouter « -là », c’est ce.',
    body: 'Certaines confusions reviennent dans presque tous les textes.\n\n**ce / se** — *ce* montre (*ce livre*), *se* est réfléchi (*il se lave*).\n**ces / ses** — *ces* montre plusieurs choses, *ses* indique la possession.\n**c’est / s’est** — *c’est* = cela est, *s’est* accompagne un verbe pronominal.\n**leur / leurs** — devant un verbe, *leur* ne prend jamais de -s.\n\nEt les doubles consonnes s’apprennent mot par mot : *apparaître*, *développer*, *professionnel*.',
    examples: [
      { wrong: 'Il ce lave les mains.', right: 'Il se lave les mains.', note: '« se » est le pronom réfléchi.' },
      { wrong: 'C’est ces affaires.', right: 'Ce sont ses affaires.', note: 'Possession : ses.' },
      { wrong: 'Je leurs ai parlé.', right: 'Je leur ai parlé.', note: '« leur » pronom ne prend pas de -s.' },
    ],
    exercises: [
      { question: '___ livre est à moi.', choices: ['Se', 'Ce', 'Ces', 'Ses'], answerIndex: 1, explanation: 'Déterminant démonstratif singulier : ce.' },
      { question: 'Elle ___ souvenue de tout.', choices: ['c’est', 's’est', 'ses', 'ces'], answerIndex: 1, explanation: 'Verbe pronominal : s’est souvenue.' },
      { question: 'Il a perdu ___ clés.', choices: ['ces', 'ses', 'c’est', 's’est'], answerIndex: 1, explanation: 'Les clés lui appartiennent : ses.' },
      { question: 'Je ___ ai donné mon numéro.', choices: ['leurs', 'leur', 'leures', 'l’heure'], answerIndex: 1, explanation: 'Pronom devant le verbe : leur, invariable.' },
      { question: 'Quelle orthographe est correcte ?', choices: ['developper', 'dévelloper', 'développer', 'déveloper'], answerIndex: 2, explanation: 'Deux « p » : développer.' },
    ],
  },

  punctuation: {
    title: 'La ponctuation française',
    memoryHook: 'Les signes à deux étages - ; : ! ? - réclament une espace avant. En français, la ponctuation respire.',
    body: 'La règle qui surprend le plus : en français, les signes **doubles** prennent une **espace avant** — `; : ! ?` et les guillemets.\n\n*Comment ça va ?* — avec une espace avant le point d’interrogation.\n*Il a dit : « bonjour ».* — avec les guillemets français « » et une espace à l’intérieur.\n\nLes signes **simples** (`. ,`) ne prennent rien avant, une espace après.\n\nLa virgule ne peut pas relier deux phrases complètes toute seule : il faut un point, un point-virgule, ou un mot comme *et*, *mais*, *donc*.',
    examples: [
      { wrong: 'Comment ça va?', right: 'Comment ça va ?', note: 'Espace avant le point d’interrogation.' },
      { wrong: 'Il a dit "bonjour".', right: 'Il a dit « bonjour ».', note: 'Guillemets français avec espaces intérieures.' },
      { wrong: 'Il pleuvait, nous sommes restés.', right: 'Il pleuvait, donc nous sommes restés.', note: 'Une virgule seule ne relie pas deux phrases.' },
    ],
    exercises: [
      { question: 'Quelle phrase est correcte ?', choices: ['Tu viens?', 'Tu viens ?', 'Tu viens ?.', 'Tu viens.?'], answerIndex: 1, explanation: 'Espace insécable avant le « ? ».' },
      { question: 'Quelle phrase est correcte ?', choices: ['Voici la liste: pain, lait.', 'Voici la liste : pain, lait.', 'Voici la liste :pain, lait.', 'Voici la liste;pain, lait.'], answerIndex: 1, explanation: 'Espace avant et après les deux-points.' },
      { question: 'Quels guillemets sont français ?', choices: ['"mot"', '« mot »', '“mot”', '\'mot\''], answerIndex: 1, explanation: 'Le français utilise les chevrons « ».' },
      { question: 'Quelle phrase relie correctement ?', choices: ['J’étais fatigué, je suis parti.', 'J’étais fatigué je suis parti.', 'J’étais fatigué, donc je suis parti.', 'J’étais fatigué donc, je suis parti.'], answerIndex: 2, explanation: 'Un mot de liaison relie les deux propositions.' },
      { question: 'Où met-on la majuscule ?', choices: ['les français parlent vite', 'Les Français parlent vite', 'Les français parlent vite', 'les Français parlent Vite'], answerIndex: 1, explanation: 'Le nom d’habitants prend une majuscule ; début de phrase aussi.' },
    ],
  },

  'word-choice': {
    title: 'Choisir le mot juste',
    memoryHook: 'Connaître prend un nom, savoir prend une phrase : je connais Paris, mais je sais où il est.',
    body: 'Quelques paires trompent presque tout le monde.\n\n**savoir / connaître** — *savoir* une information ou faire quelque chose, *connaître* une personne ou un lieu. *Je **sais** nager. Je **connais** Paris.*\n**an / année** — *an* compte, *année* décrit la durée. *J’ai vingt **ans**. Une bonne **année**.*\n**bon / bien** — *bon* est un adjectif, *bien* un adverbe. *Un **bon** repas. Il travaille **bien**.*\n**apporter / amener** — on *apporte* une chose, on *amène* une personne.\n\nEt les faux amis de l’anglais : *actuellement* = en ce moment (pas « actually »), *librairie* = bookshop (pas library).',
    examples: [
      { wrong: 'Je connais nager.', right: 'Je sais nager.', note: 'Une capacité : savoir.' },
      { wrong: 'Il parle très bon français.', right: 'Il parle très bien français.', note: 'Adverbe après le verbe : bien.' },
      { wrong: 'J’ai vingt années.', right: 'J’ai vingt ans.', note: 'On compte les ans.' },
    ],
    exercises: [
      { question: 'Je ___ cette chanson par cœur.', choices: ['connais', 'sais', 'sait', 'connaît'], answerIndex: 0, explanation: 'On connaît une chanson ; on sait la chanter.' },
      { question: 'Elle chante très ___.', choices: ['bon', 'bonne', 'bien', 'meilleur'], answerIndex: 2, explanation: 'Adverbe : bien.' },
      { question: 'Il a passé trois ___ à Berlin.', choices: ['ans', 'années', 'annuels', 'an'], answerIndex: 0, explanation: 'Un nombre précis : ans.' },
      { question: 'Peux-tu ___ ton frère à la fête ?', choices: ['apporter', 'amener', 'emporter', 'porter'], answerIndex: 1, explanation: 'On amène une personne.' },
      { question: '« Actuellement » veut dire :', choices: ['en réalité', 'en ce moment', 'peut-être', 'autrefois'], answerIndex: 1, explanation: 'Faux ami : actuellement = en ce moment.' },
    ],
  },

  other: {
    title: 'Rendre la phrase plus naturelle',
    memoryHook: 'Le naturel ne vient pas de plus de grammaire, mais de phrases plus courtes et du mot le plus simple.',
    body: 'Votre phrase était compréhensible, mais un petit changement la rend plus naturelle.\n\nCe qui fait le plus progresser n’est pas plus de grammaire : ce sont des **phrases plus courtes**, des **verbes plus précis**, et **moins de mots vides**.\n\nComparez : *J’ai pris la décision de faire une amélioration de mon français* → *J’ai décidé d’améliorer mon français.* Même sens, moitié moins de mots.\n\nÀ l’écrit, préférez aussi la forme active : *Le rapport **a été écrit** par Marie* → *Marie **a écrit** le rapport.*',
    examples: [
      { wrong: 'J’ai pris la décision de partir.', right: 'J’ai décidé de partir.', note: 'Un verbe précis vaut mieux que verbe + nom.' },
      { wrong: 'En raison du fait qu’il pleuvait...', right: 'Parce qu’il pleuvait...' },
      { wrong: 'À mon avis, je pense que...', right: 'Je pense que...', note: 'Ne le dites qu’une fois.' },
    ],
    exercises: [
      { question: 'Quelle phrase est la plus naturelle ?', choices: ['J’ai fait une décision.', 'J’ai pris une décision.', 'J’ai décidé.', 'J’ai donné une décision.'], answerIndex: 2, explanation: 'Le verbe seul est le plus direct.' },
      { question: 'Quelle formule est la plus concise ?', choices: ['En raison du fait que', 'Parce que', 'Du fait de la raison que', 'Compte tenu du fait que'], answerIndex: 1, explanation: '« Parce que » suffit.' },
      { question: 'Quelle phrase est la plus claire ?', choices: ['À mon avis je pense que c’est bien.', 'Je pense que c’est bien.', 'Mon avis je pense bien.', 'Selon mon avis personnel je pense.'], answerIndex: 1, explanation: 'Ne répétez pas la même idée.' },
      { question: 'Quelle phrase est la plus directe ?', choices: ['Le repas a été préparé par Paul.', 'Paul a préparé le repas.', 'Il a été fait une préparation du repas.', 'Le repas, il a été préparé.'], answerIndex: 1, explanation: 'La voix active est plus directe.' },
      { question: 'Quelle expression est la plus claire ?', choices: ['À l’heure actuelle', 'Maintenant', 'Dans le moment présent', 'Au moment où nous sommes'], answerIndex: 1, explanation: 'Un mot clair vaut mieux que quatre mots vagues.' },
    ],
  },
}

const LESSONS_BY_LANGUAGE: Record<LearningLanguage, Partial<Record<ErrorType, LessonTemplate>>> = {
  en: EN_LESSONS,
  fr: FR_LESSONS,
}

/**
 * The teaching template for a mistake. Falls back to the language's "other"
 * lesson, which is always present, so a correction tagged with a type that
 * language has no lesson for still produces something useful.
 */
export function lessonTemplate(
  language: LearningLanguage,
  errorType: ErrorType,
): LessonTemplate {
  const library = LESSONS_BY_LANGUAGE[language]
  return library[errorType] ?? library.other ?? EN_LESSONS.other!
}
