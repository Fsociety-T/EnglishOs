import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CheckCircle2, RotateCcw, X } from 'lucide-react'
import Prose from '@/components/Prose'
import { Badge, Button, Card, SectionHeading, Spinner } from '@/components/ui'
import { useAsync } from '@/hooks/useAsync'
import { ERROR_TONE } from '@/lib/errorStyles'
import { cn } from '@/lib/utils'
import { useRepo } from '@/services/db'
import { ERROR_TYPE_LABEL } from '@/types'

/** Getting most of them right is enough to call it learned. */
const MASTERY_THRESHOLD = 0.8

export default function LessonDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const repo = useRepo()

  const [quizStarted, setQuizStarted] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [answers, setAnswers] = useState<boolean[]>([])

  const { data: lesson, loading, reload } = useAsync(
    () => (id ? repo.getLesson(id) : Promise.resolve(null)),
    [id],
  )

  if (loading) return <Spinner label="Loading lesson..." />

  if (!lesson) {
    return (
      <Card>
        <p className="text-fg-muted">That lesson could not be found.</p>
        <div className="mt-4">
          <Link to="/lessons">
            <Button variant="outline">Back to lessons</Button>
          </Link>
        </div>
      </Card>
    )
  }

  const question = lesson.exercises[questionIndex]
  const finished = quizStarted && questionIndex >= lesson.exercises.length
  const correctCount = answers.filter(Boolean).length
  const ratio = answers.length > 0 ? correctCount / answers.length : 0

  function choose(index: number) {
    if (picked !== null || !question) return
    setPicked(index)
    setAnswers((prev) => [...prev, index === question.answerIndex])
  }

  async function next() {
    const nextIndex = questionIndex + 1
    setPicked(null)
    setQuestionIndex(nextIndex)

    if (lesson && nextIndex >= lesson.exercises.length) {
      const finalRatio =
        lesson.exercises.length > 0 ? answers.filter(Boolean).length / lesson.exercises.length : 0
      const status = finalRatio >= MASTERY_THRESHOLD ? 'mastered' : 'learning'
      await repo.setLessonStatus(lesson.id, status)
      if (status === 'mastered') await repo.recordActivity({ lessonsCompleted: 1 })
      reload()
    }
  }

  function restart() {
    setQuizStarted(true)
    setQuestionIndex(0)
    setPicked(null)
    setAnswers([])
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-fg-muted transition hover:text-fg"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
              ERROR_TONE[lesson.errorType].chip,
            )}
          >
            {ERROR_TYPE_LABEL[lesson.errorType]}
          </span>
          {lesson.status === 'mastered' && (
            <Badge tone="good">
              <CheckCircle2 className="size-3" />
              Mastered
            </Badge>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">{lesson.title}</h1>
      </header>

      {lesson.sourceSentence && (
        <Card className="border-violet/30">
          <p className="text-xs font-medium tracking-wide text-fg-faint uppercase">
            This came from your own writing
          </p>
          <p className="mt-2 leading-relaxed text-fg italic">
            &ldquo;{lesson.sourceSentence}&rdquo;
          </p>
        </Card>
      )}

      <Card>
        <Prose text={lesson.body} />
      </Card>

      <section>
        <SectionHeading title="Right and wrong, side by side" />
        <div className="space-y-3">
          {lesson.examples.map((example, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start gap-2 text-sm">
                <X className="mt-0.5 size-4 shrink-0 text-bad" />
                <span className="text-fg-muted line-through">{example.wrong}</span>
              </div>
              <div className="mt-2 flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-good" />
                <span className="font-medium text-fg">{example.right}</span>
              </div>
              {example.note && (
                <p className="mt-2 pl-6 text-sm leading-relaxed text-fg-faint">{example.note}</p>
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Quiz */}
      <section>
        <SectionHeading
          title="Check you have it"
          subtitle={`${lesson.exercises.length} quick questions.`}
        />

        {!quizStarted ? (
          <Card className="text-center">
            <p className="text-fg-muted">
              Answer {Math.ceil(lesson.exercises.length * MASTERY_THRESHOLD)} or more correctly to
              mark this lesson as mastered.
            </p>
            <div className="mt-4">
              <Button onClick={restart}>Start the quiz</Button>
            </div>
          </Card>
        ) : finished ? (
          <Card className="text-center">
            <p className="text-4xl font-bold text-gradient">
              {correctCount}/{lesson.exercises.length}
            </p>
            <p className="mt-3 leading-relaxed text-fg-muted">
              {ratio >= MASTERY_THRESHOLD
                ? 'Strong. This lesson is marked as mastered - it will stop appearing in your weak areas.'
                : 'Not quite yet. Read the examples again and retry - this stays in your learning list.'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={restart} variant="outline">
                <RotateCcw className="size-4" />
                Try again
              </Button>
              <Link to="/lessons">
                <Button>Back to lessons</Button>
              </Link>
            </div>
          </Card>
        ) : question ? (
          <Card>
            <div className="flex items-center justify-between text-sm text-fg-faint">
              <span>
                Question {questionIndex + 1} of {lesson.exercises.length}
              </span>
              <span>
                {correctCount} correct
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-neon transition-[width] duration-300"
                style={{ width: `${(questionIndex / lesson.exercises.length) * 100}%` }}
              />
            </div>

            <p className="mt-5 text-lg font-medium text-fg">{question.question}</p>

            <div className="mt-4 space-y-2">
              {question.choices.map((choice, i) => {
                const isAnswer = i === question.answerIndex
                const isPicked = picked === i
                const revealed = picked !== null
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => choose(i)}
                    disabled={revealed}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition',
                      !revealed && 'border-white/10 bg-white/5 hover:bg-white/10',
                      revealed && isAnswer && 'border-good/40 bg-good/15 text-good',
                      revealed && isPicked && !isAnswer && 'border-bad/40 bg-bad/15 text-bad',
                      revealed && !isAnswer && !isPicked && 'border-white/10 opacity-50',
                    )}
                  >
                    {choice}
                    {revealed && isAnswer && <Check className="size-4 shrink-0" />}
                    {revealed && isPicked && !isAnswer && <X className="size-4 shrink-0" />}
                  </button>
                )
              })}
            </div>

            {picked !== null && (
              <>
                <p className="mt-4 rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-fg-muted">
                  {question.explanation}
                </p>
                <div className="mt-4">
                  <Button onClick={next}>
                    {questionIndex + 1 >= lesson.exercises.length ? 'See my result' : 'Next question'}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </>
            )}
          </Card>
        ) : null}
      </section>
    </div>
  )
}
