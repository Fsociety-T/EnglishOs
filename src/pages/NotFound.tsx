import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl pt-6">
      <EmptyState
        title="That page does not exist"
        body="The link may be old, or the page may have moved."
        action={
          <Link to="/">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
