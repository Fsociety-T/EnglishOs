/**
 * Does the wrong-language guard fire when it should, and stay quiet otherwise?
 *
 * The two failure modes are not equally bad, and this script is weighted the
 * same way the detector is. A missed detection means one page of useless
 * corrections. A false alarm means a learner who wrote perfectly good French
 * is told their French is not French, with no way to proceed - so every
 * "should stay quiet" case below is treated as a hard failure, including the
 * awkward ones: beginner writing, missing accents, borrowed vocabulary.
 */

import { detectWrongLanguage, scoreLanguages } from '../src/lib/detectLanguage.ts'
import type { LearningLanguage } from '../src/types/index.ts'

interface Case {
  name: string
  text: string
  /** The language the learner is studying. */
  expected: LearningLanguage
  /** What the guard should return: a language to complain about, or null. */
  want: LearningLanguage | null
}

const CASES: Case[] = [
  /* ------------------------------------------------ should stay quiet -- */
  {
    name: 'EN learner, ordinary English',
    expected: 'en',
    want: null,
    text: `Last weekend I went to the coast with my brother. The weather was not very good, so we spent most of the morning in a small cafe near the harbour, watching the boats come in. In the afternoon it cleared up and we walked along the beach for about an hour. I had not seen him since March, so we had a lot to talk about.`,
  },
  {
    name: 'EN learner, very simple beginner English',
    expected: 'en',
    want: null,
    text: `I like my job. My job is good. I work in a shop. The shop is near my house. I go to work at eight. I come home at five. I have two friends at work. We eat lunch together. I am happy in my job. My boss is nice to me. I want to work here for a long time.`,
  },
  {
    name: 'EN learner using French loanwords',
    expected: 'en',
    want: null,
    text: `We ate at a small cafe with a nice terrace. The menu was short but the food had real flair, and the chef came out to say hello. My friend ordered the soup du jour and I had an omelette. It was a cliche of a holiday evening, but honestly it was the best part of the trip and I would go back tomorrow.`,
  },
  {
    name: 'FR learner, ordinary French',
    expected: 'fr',
    want: null,
    text: `Le week-end dernier, je suis allé à la mer avec mon frère. Il ne faisait pas très beau, alors nous avons passé la matinée dans un petit café près du port, à regarder les bateaux rentrer. L’après-midi, le temps s’est levé et nous avons marché sur la plage pendant une heure.`,
  },
  {
    name: 'FR learner, no accents typed at all',
    expected: 'fr',
    want: null,
    text: `Je suis alle au magasin hier parce que je voulais acheter du pain et du fromage. Il y avait beaucoup de monde et j'ai attendu tres longtemps. Le vendeur etait tres gentil avec moi et il m'a explique ou trouver les autres choses que je cherchais dans le magasin.`,
  },
  {
    name: 'FR learner, simple beginner French',
    expected: 'fr',
    want: null,
    text: `J’aime mon travail. Mon travail est bien. Je travaille dans un magasin. Le magasin est près de ma maison. Je vais au travail à huit heures. Je rentre à cinq heures. J’ai deux amis au travail. Nous mangeons ensemble. Je suis content.`,
  },
  {
    name: 'EN learner, short text (too short to judge)',
    expected: 'en',
    want: null,
    text: `Je suis allé au magasin hier avec mon frère.`,
  },
  {
    name: 'FR learner quoting one English sentence',
    expected: 'fr',
    want: null,
    text: `Hier, j’ai regardé un film américain avec mon frère. À la fin, le personnage principal dit "I will never forget what you did for me", et cette phrase m’a beaucoup touché. Je pense que je vais revoir ce film la semaine prochaine avec mes parents.`,
  },

  /* ---------------------------------------------------- should complain -- */
  {
    name: 'EN learner writing French',
    expected: 'en',
    want: 'fr',
    text: `Le week-end dernier, je suis allé à la mer avec mon frère. Il ne faisait pas très beau, alors nous avons passé la matinée dans un petit café près du port. L’après-midi, le temps s’est levé et nous avons marché sur la plage pendant une heure environ.`,
  },
  {
    name: 'FR learner writing English',
    expected: 'fr',
    want: 'en',
    text: `Last weekend I went to the coast with my brother. The weather was not very good, so we spent most of the morning in a small cafe near the harbour. In the afternoon it cleared up and we walked along the beach for about an hour before we drove home again.`,
  },
  {
    name: 'FR learner writing simple English',
    expected: 'fr',
    want: 'en',
    text: `I like my job. My job is good. I work in a shop. The shop is near my house. I go to work at eight and I come home at five. I have two friends at work and we eat lunch together every day. I am happy and I want to stay here.`,
  },
  {
    name: 'EN learner writing simple French',
    expected: 'en',
    want: 'fr',
    text: `J’aime mon travail. Mon travail est bien. Je travaille dans un magasin près de ma maison. Je vais au travail à huit heures et je rentre à cinq heures. J’ai deux amis au travail et nous mangeons ensemble tous les jours.`,
  },
]

let failures = 0
console.log('want      got       en     fr    words  case')
console.log('-'.repeat(88))

for (const testCase of CASES) {
  const got = detectWrongLanguage(testCase.text, testCase.expected)
  const scores = scoreLanguages(testCase.text)
  const ok = got === testCase.want
  if (!ok) failures++
  console.log(
    `${String(testCase.want ?? 'quiet').padEnd(9)} ${String(got ?? 'quiet').padEnd(9)} ` +
      `${scores.en.toFixed(2)}   ${scores.fr.toFixed(2)}  ${String(scores.wordCount).padStart(5)}  ` +
      `${ok ? ' ' : 'FAIL '}${testCase.name}`,
  )
}

console.log()
if (failures > 0) {
  console.error(`${failures} case(s) failed.`)
  process.exit(1)
}
console.log('Wrong-language detection OK.')
