import { Link } from 'react-router-dom'
import { Button, EmptyState } from '@/components/ui'
import { useT } from '@/i18n'

export default function NotFound() {
  const t = useT()
  return (
    <div className="mx-auto max-w-2xl pt-6">
      <EmptyState
        title={t('notFound.title')}
        body={t('notFound.body')}
        action={
          <Link to="/">
            <Button>{t('notFound.back')}</Button>
          </Link>
        }
      />
    </div>
  )
}
