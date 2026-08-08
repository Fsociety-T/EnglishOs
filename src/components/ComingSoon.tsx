import { Hammer } from 'lucide-react'
import { EmptyState } from '@/components/ui'

/** Honest placeholder for a screen whose phase has not landed yet. */
export default function ComingSoon({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-2xl pt-6">
      <EmptyState icon={<Hammer className="size-6" />} title={title} body={body} />
    </div>
  )
}
