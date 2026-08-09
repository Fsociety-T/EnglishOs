import type { LearningLanguage } from '@/types'

/**
 * Prompts for the placement test.
 *
 * These are not drawn from TOPICS on purpose. Every topic there carries a
 * level tag, so the result would depend on which card the learner happened to
 * draw - an A2 prompt cannot show that someone writes at C1.
 *
 * A placement prompt needs a **low floor and a high ceiling**: answerable in
 * five plain sentences by a beginner, and capable of carrying real nuance for
 * an advanced writer. Each one below hides a hook - a conditional, a
 * hypothetical past, a comparison - that an advanced writer will pick up and a
 * beginner will simply walk past. Walking past it is itself the signal.
 */
export interface PlacementPrompt {
  id: string
  language: LearningLanguage
  title: string
  prompt: string
}

const EN: PlacementPrompt[] = [
  {
    id: 'p-en-1',
    language: 'en',
    title: 'Your typical day',
    prompt:
      'Describe a normal day in your life, from morning to evening. Then explain what you would change about it if you could, and why that change would matter to you.',
  },
  {
    id: 'p-en-2',
    language: 'en',
    title: 'A person who changed you',
    prompt:
      'Tell me about someone who changed the way you think. What did they say or do? How would your life have been different if you had never met them?',
  },
  {
    id: 'p-en-3',
    language: 'en',
    title: 'A place that matters to you',
    prompt:
      'Describe a place that means something to you. What does it look like, and what happened there? Would you still feel the same way about it if you went back today?',
  },
  {
    id: 'p-en-4',
    language: 'en',
    title: 'Something you had to decide',
    prompt:
      'Describe a decision you had to make. What were your choices, what did you pick, and what might have happened if you had chosen differently?',
  },
  {
    id: 'p-en-5',
    language: 'en',
    title: 'Learning something difficult',
    prompt:
      'Write about something you found hard to learn. How did you approach it, what went wrong, and what advice would you give someone starting now?',
  },
  {
    id: 'p-en-6',
    language: 'en',
    title: 'Your town, and how it is changing',
    prompt:
      'Describe the place where you live. How has it changed since you have known it, and how do you think it will look in twenty years?',
  },
]

const FR: PlacementPrompt[] = [
  {
    id: 'p-fr-1',
    language: 'fr',
    title: 'Une journée ordinaire',
    prompt:
      'Décrivez une journée normale de votre vie, du matin au soir. Expliquez ensuite ce que vous changeriez si vous le pouviez, et pourquoi ce changement compterait pour vous.',
  },
  {
    id: 'p-fr-2',
    language: 'fr',
    title: 'Une personne qui vous a changé',
    prompt:
      'Parlez d’une personne qui a changé votre façon de penser. Qu’a-t-elle dit ou fait ? Comment votre vie aurait-elle été différente si vous ne l’aviez jamais rencontrée ?',
  },
  {
    id: 'p-fr-3',
    language: 'fr',
    title: 'Un lieu qui compte pour vous',
    prompt:
      'Décrivez un lieu qui compte pour vous. À quoi ressemble-t-il, et que s’y est-il passé ? Ressentiriez-vous la même chose si vous y retourniez aujourd’hui ?',
  },
  {
    id: 'p-fr-4',
    language: 'fr',
    title: 'Une décision à prendre',
    prompt:
      'Décrivez une décision que vous avez dû prendre. Quelles étaient les options, qu’avez-vous choisi, et que serait-il arrivé si vous aviez choisi autrement ?',
  },
  {
    id: 'p-fr-5',
    language: 'fr',
    title: 'Apprendre quelque chose de difficile',
    prompt:
      'Parlez de quelque chose que vous avez eu du mal à apprendre. Comment vous y êtes-vous pris, qu’est-ce qui n’a pas marché, et quel conseil donneriez-vous à quelqu’un qui commence ?',
  },
  {
    id: 'p-fr-6',
    language: 'fr',
    title: 'Votre ville, et comment elle change',
    prompt:
      'Décrivez l’endroit où vous vivez. Comment a-t-il changé depuis que vous le connaissez, et à quoi ressemblera-t-il dans vingt ans selon vous ?',
  },
]

const BY_LANGUAGE: Record<LearningLanguage, PlacementPrompt[]> = { en: EN, fr: FR }

/**
 * A prompt to sit the test with. `exclude` is the previous attempt's prompt,
 * so retaking the test does not hand back the same question and measure how
 * well the learner remembers their last answer.
 */
export function placementPrompt(
  language: LearningLanguage,
  exclude?: string,
): PlacementPrompt {
  const all = BY_LANGUAGE[language]
  const pool = exclude ? all.filter((p) => p.id !== exclude) : all
  return pool[Math.floor(Math.random() * pool.length)]
}

export function placementPrompts(language: LearningLanguage): PlacementPrompt[] {
  return BY_LANGUAGE[language]
}
