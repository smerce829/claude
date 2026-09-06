import { useEffect, useState } from 'react'
import { PrimaryButton, SecondaryAction } from './Controls'
import './InstallPrompt.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * Shown once, after the first completed task. Never on first load.
 * Chrome fires beforeinstallprompt; iOS never does, so iOS gets the manual
 * instruction instead of nothing.
 */
export function InstallPrompt({ onSettled }: { onSettled: () => void }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as { standalone?: boolean }).standalone === true
    if (standalone) { onSettled(); return }

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    const onBip = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBip)
    return () => window.removeEventListener('beforeinstallprompt', onBip)
  }, [onSettled])

  if (!deferred && !isIOS) return null

  const install = async () => {
    if (deferred) { await deferred.prompt(); await deferred.userChoice }
    onSettled()
  }

  return (
    <div className="install" role="dialog" aria-label="Add to home screen">
      <p className="install__text">
        {isIOS && !deferred
          ? 'Add this to your home screen: share, then add to home screen.'
          : 'Add this to your home screen so it opens like an app.'}
      </p>
      {isIOS && !deferred
        ? <PrimaryButton onClick={onSettled}>got it</PrimaryButton>
        : <PrimaryButton onClick={() => void install()}>add to home screen</PrimaryButton>}
      <SecondaryAction onClick={onSettled}>not now</SecondaryAction>
    </div>
  )
}
