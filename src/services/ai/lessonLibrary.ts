import type { ErrorType } from '@/types'

export interface LessonTemplate {
  title: string
  body: string
  examples: { wrong: string; right: string; note?: string }[]
  exercises: { question: string; choices: string[]; answerIndex: number; explanation: string }[]
}

/**
 * One teaching template per error type. The generator picks the template that
 * matches the learner's most frequent mistake and attaches the sentence they
 * actually wrote, so the lesson is never generic filler.
 */
export const LESSON_LIBRARY: Record<ErrorType, LessonTemplate> = {
  'verb-tense': {
    title: 'Choosing the right verb tense',
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
