/**
 * Calibration for the offline level estimator.
 *
 * Run with:  npx tsx scripts/calibrate-levels.mts
 *
 * This is not a unit test of the arithmetic - it checks the thing that would
 * make the placement test worse than useless: that a clean beginner is never
 * ranked above an ambitious intermediate. Accuracy alone would invert exactly
 * that pair, and the inversion is invisible unless something asserts it.
 *
 * Absolute bands are allowed one CEFR level of slack, which is all a single
 * writing sample honestly supports.
 */
import { estimateLevel, measureRange } from '../src/lib/level'
import { mockProvider } from '../src/services/ai/mockProvider'
import { CEFR_LEVELS } from '../src/types'
import type { CefrLevel, LearningLanguage } from '../src/types'

interface Sample {
  name: string
  lang: LearningLanguage
  /** The band this text was written to sit in. */
  target: CefrLevel
  text: string
}

/** Written as one paragraph each: a learner types continuously, not hard-wrapped. */
const SAMPLES: Sample[] = [
  {
    name: 'EN A1 flawless but tiny range',
    lang: 'en',
    target: 'A1',
    text: `I like my job. My job is good. I go to work every day. I take the bus. The bus is slow. I work in a shop. The shop is big. I sell food. I like my boss. My boss is nice. I start at nine. I finish at five. I eat lunch at one. I eat rice. I like rice. After work I go home. I watch TV. I like football. I go to bed at ten. My family is small. I have one sister. She is a student. She is nice. I like my family. On Saturday I do not work. I go to the park. The park is near. I walk there. It is nice. I want a big house. I want a car. I like my life.`,
  },
  {
    name: 'EN A2 simple linking',
    lang: 'en',
    target: 'A2',
    text: `Last summer I went to Spain with my brother because we wanted a holiday near the sea. We stayed in a small hotel and the room was clean but very hot. Every morning we ate breakfast in a cafe and then we walked to the beach. The water was warm and I swam every day. In the evening we ate fish and we tried some local food. One day we visited an old castle. It was very big and there were many tourists. I took a lot of photos with my phone. I liked the trip a lot but it was too short. Next year I want to go again and stay for two weeks. I also want to learn some Spanish before I go.`,
  },
  {
    name: 'EN B1 connected narrative',
    lang: 'en',
    target: 'B1',
    text: `Last year I decided to move to another city because I wanted to find a better job. It was difficult at the beginning because I did not know anybody there and the rent was very expensive. I found a small flat near the station and I started to work in a restaurant. The work was hard but the people were friendly and I learned a lot about how a kitchen is organised. After six months I found a better job in an office, which was a big change for me. Now I am happier because the hours are normal and I can see my friends in the evening. Sometimes I miss my old town and my family, but I think I made the right choice for my career.`,
  },
  {
    name: 'EN B2 natural, some reach',
    lang: 'en',
    target: 'B2',
    text: `I have been working in the same company for about four years now, and although the job is comfortable I have started wondering whether I should look for something else. The main problem is that I am not learning anything new. When I joined, everything was a challenge and I had to ask for help constantly, but these days I could probably do most of my tasks without thinking. My manager says there will be opportunities next year, however I have heard that before and nothing happened. If I stay, I risk becoming the person who has ten years of experience that is really one year repeated ten times. On the other hand, changing job means losing the people I like working with, and that matters more than I expected.`,
  },
  {
    name: 'EN C1 argued and hedged',
    lang: 'en',
    target: 'C1',
    text: `What strikes me about the debate over remote work is how rarely either side examines its own assumptions. Advocates tend to treat flexibility as an unqualified good, as though the only thing an office ever provided was surveillance; critics, meanwhile, invoke culture and collaboration without ever specifying what those words are supposed to mean in practice. Had the pandemic not forced the experiment upon us, we might still be arguing from anecdote. What the evidence now suggests, insofar as it can be trusted, is considerably messier than either camp would like: productivity appears to hold or improve for well-defined individual work, whereas anything requiring negotiation between people who do not already trust each other suffers measurably. Were I designing a policy today, I would resist the temptation to legislate a fixed number of days, which optimises for administrative tidiness rather than for the work itself.`,
  },
  {
    name: 'FR A1 flawless but tiny range',
    lang: 'fr',
    target: 'A1',
    text: `J'aime mon travail. Mon travail est bon. Je vais au bureau tous les jours. Je prends le bus. Le bus est lent. Je travaille dans un magasin. Le magasin est grand. Je vends du pain. J'aime mon chef. Mon chef est gentil. Je commence à neuf heures. Je finis à cinq heures. Je mange à midi. Je mange du riz. J'aime le riz. Après le travail je rentre à la maison. Je regarde la télévision. J'aime le football. Je dors à dix heures. Ma famille est petite. J'ai une sœur. Elle est étudiante. Elle est gentille. J'aime ma famille. Le samedi je ne travaille pas. Je vais au parc. Le parc est près. Je marche. Ma vie est simple.`,
  },
  {
    name: 'FR B1 connected narrative',
    lang: 'fr',
    target: 'B1',
    text: `L'année dernière j'ai décidé de déménager dans une autre ville parce que je voulais trouver un meilleur travail. Au début c'était difficile parce que je ne connaissais personne et le loyer était très cher. J'ai trouvé un petit appartement près de la gare et j'ai commencé à travailler dans un restaurant. Le travail était dur mais les gens étaient sympas et j'ai beaucoup appris. Après six mois j'ai trouvé un poste dans un bureau. Maintenant je suis plus content parce que les horaires sont normaux et je peux voir mes amis le soir. Parfois ma famille me manque, mais je pense que j'ai fait le bon choix pour ma carrière.`,
  },
  {
    name: 'FR C1 argued and hedged',
    lang: 'fr',
    target: 'C1',
    text: `Ce qui frappe dans le débat sur le télétravail, c'est la rareté avec laquelle chaque camp interroge ses propres présupposés. Les partisans tendent à considérer la flexibilité comme un bien absolu, comme si le bureau n'avait jamais servi qu'à surveiller ; les détracteurs, quant à eux, invoquent la culture d'entreprise sans jamais préciser ce que ce mot recouvre concrètement. Si la pandémie ne nous avait pas imposé l'expérience, nous en serions sans doute encore à raisonner par anecdotes. Ce que les données suggèrent aujourd'hui, dans la mesure où l'on peut s'y fier, est nettement plus nuancé : la productivité se maintient pour les tâches individuelles bien définies, tandis que tout ce qui exige une négociation entre personnes qui ne se font pas encore confiance en souffre nettement. Si je devais concevoir une politique, je résisterais à la tentation de fixer un nombre de jours.`,
  },
]

function distance(a: CefrLevel, b: CefrLevel): number {
  return Math.abs(CEFR_LEVELS.indexOf(a) - CEFR_LEVELS.indexOf(b))
}

let failures = 0
const scored: Record<string, { level: CefrLevel; range: number }> = {}

console.log('got  want  off  range  sample')
console.log('-'.repeat(72))

for (const s of SAMPLES) {
  const review = await mockProvider.reviewWriting({
    text: s.text,
    topic: 'placement',
    level: 'B1',
    language: s.lang,
  })
  const est = estimateLevel({ text: s.text, corrections: review.corrections, language: s.lang })
  const range = measureRange(s.text, s.lang)
  const off = distance(est.level, s.target)
  scored[s.name] = { level: est.level, range: range.score }

  // One band of slack is honest for a single sample; two is a real miss.
  if (off > 1) failures++
  console.log(
    `${est.level.padEnd(4)} ${s.target.padEnd(5)} ${(off > 1 ? `FAIL ${off}` : String(off)).padEnd(4)} ${range.score.toFixed(0).padStart(5)}  ${s.name}`,
  )
}

console.log('\nOrdering — the property that actually matters:')
const ORDER: [string, string][] = [
  ['EN A1 flawless but tiny range', 'EN A2 simple linking'],
  ['EN A2 simple linking', 'EN B1 connected narrative'],
  ['EN B1 connected narrative', 'EN B2 natural, some reach'],
  ['EN B2 natural, some reach', 'EN C1 argued and hedged'],
  ['FR A1 flawless but tiny range', 'FR B1 connected narrative'],
  ['FR B1 connected narrative', 'FR C1 argued and hedged'],
]
for (const [lower, higher] of ORDER) {
  const lo = scored[lower]
  const hi = scored[higher]
  const ok = hi.range > lo.range
  if (!ok) failures++
  console.log(
    `  ${ok ? 'ok  ' : 'FAIL'} ${lo.range.toFixed(0).padStart(3)} < ${hi.range.toFixed(0).padStart(3)}   ${lower}  <  ${higher}`,
  )
}

console.log(
  failures === 0
    ? '\nCalibration OK.'
    : `\n${failures} calibration problem(s).`,
)
process.exit(failures === 0 ? 0 : 1)
