import { Fragment } from 'react'

/**
 * Renders the light markdown used in lesson bodies: blank-line paragraphs and
 * **bold**. A full markdown library would be far more weight than three lines
 * of formatting need.
 */
export default function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split('\n\n').map((paragraph, i) => (
        <p key={i} className="leading-relaxed text-fg-muted">
          {paragraph.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j} className="font-semibold text-fg">
                {part.slice(2, -2)}
              </strong>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
        </p>
      ))}
    </div>
  )
}
