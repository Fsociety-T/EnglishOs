/**
 * Does the transcript parser survive what a real paste looks like?
 *
 * The learner copies this out of a panel they did not design, so the shape
 * varies: times above the words, times in front of the words, brackets, hours
 * on long episodes, blank lines everywhere, and sometimes no times at all. Get
 * it wrong and the panel either loses lines or glues two speakers together.
 *
 * Every fixture below is invented placeholder speech, not a real transcript.
 */

import { parseTranscript, timedCount, transcriptIndexAt } from '../src/lib/transcript.ts'
import type { TranscriptLine } from '../src/lib/transcript.ts'

interface Case {
  name: string
  raw: string
  want: TranscriptLine[]
}

const CASES: Case[] = [
  {
    name: 'time on its own line (the usual YouTube copy)',
    raw: '0:00\nwelcome back to the show\n0:04\ntoday we are talking about sleep\n1:02:03\nand that is where we will stop',
    want: [
      { text: 'welcome back to the show', startSeconds: 0 },
      { text: 'today we are talking about sleep', startSeconds: 4 },
      { text: 'and that is where we will stop', startSeconds: 3723 },
    ],
  },
  {
    name: 'time in front of the words',
    raw: '0:12 welcome back to the show\n2:05 today we are talking about sleep',
    want: [
      { text: 'welcome back to the show', startSeconds: 12 },
      { text: 'today we are talking about sleep', startSeconds: 125 },
    ],
  },
  {
    name: 'brackets and blank lines',
    raw: '[00:07]\n\nwelcome back to the show\n\n\n[01:30] today we are talking about sleep\n',
    want: [
      { text: 'welcome back to the show', startSeconds: 7 },
      { text: 'today we are talking about sleep', startSeconds: 90 },
    ],
  },
  {
    name: 'no times at all - still worth keeping',
    raw: 'welcome back to the show\ntoday we are talking about sleep',
    want: [
      { text: 'welcome back to the show', startSeconds: null },
      { text: 'today we are talking about sleep', startSeconds: null },
    ],
  },
  {
    name: 'a stray time with nothing after it must not invent a line',
    raw: '0:03\nwelcome back to the show\n9:99\n',
    want: [{ text: 'welcome back to the show', startSeconds: 3 }],
  },
  {
    name: 'decimals on the stamp',
    raw: '00:04.500 welcome back to the show',
    want: [{ text: 'welcome back to the show', startSeconds: 4 }],
  },
  {
    name: 'text that merely contains a colon is not a timestamp',
    raw: 'host: welcome back to the show\nguest: glad to be here',
    want: [
      { text: 'host: welcome back to the show', startSeconds: null },
      { text: 'guest: glad to be here', startSeconds: null },
    ],
  },
]

let failures = 0
for (const testCase of CASES) {
  const got = parseTranscript(testCase.raw)
  const ok = JSON.stringify(got) === JSON.stringify(testCase.want)
  if (!ok) {
    failures++
    console.log(`FAIL  ${testCase.name}`)
    console.log(`  want ${JSON.stringify(testCase.want)}`)
    console.log(`  got  ${JSON.stringify(got)}`)
  } else {
    console.log(`ok    ${testCase.name}  (${got.length} lines, ${timedCount(got)} timed)`)
  }
}

// Following along: the right line has to be lit at the right moment.
const lines = parseTranscript('0:00\nfirst\n0:10\nsecond\n0:20\nthird')
const expected: [number, number][] = [
  [-5, -1],
  [0, 0],
  [9, 0],
  [10, 1],
  [25, 2],
  [9999, 2],
]
for (const [at, want] of expected) {
  const got = transcriptIndexAt(lines, at)
  if (got !== want) {
    failures++
    console.log(`FAIL  active line at ${at}s: want ${want}, got ${got}`)
  }
}
console.log(`ok    active line tracks playback at ${expected.length} positions`)

console.log()
if (failures > 0) {
  console.error(`${failures} failure(s).`)
  process.exit(1)
}
console.log('Transcript parsing OK.')
