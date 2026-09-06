import { useState } from 'react'
import { ChoiceTile } from '../components/Controls'
import { Back, ScreenTitle } from '../components/Shell'
import { ROOMS } from '../lib/tasks'
import type { ResetDuration } from '../lib/types'
import './RoomReset.css'

const TIMES: ResetDuration[] = [5, 10, 20]

/** Pick a room. Pick a duration. No confirm — the second choice fires. */
export function RoomReset(
  { onStart, onBack }:
  { onStart: (room: string, minutes: ResetDuration) => void; onBack: () => void },
) {
  const [room, setRoom] = useState<string | null>(null)
  const [mins, setMins] = useState<ResetDuration | null>(null)

  const chooseRoom = (r: string) => { setRoom(r); if (mins !== null) onStart(r, mins) }
  const chooseMins = (m: ResetDuration) => { setMins(m); if (room !== null) onStart(room, m) }

  return (
    <div className="page">
      <Back onBack={onBack} />
      <div className="page__fill">
        <div className="rr__group">
          <ScreenTitle>Which room</ScreenTitle>
          <div className="rr__rooms" role="group" aria-label="room">
            {ROOMS.map((r) => (
              <button
                key={r}
                className={'rr__room' + (room === r ? ' rr__room--selected' : '')}
                onClick={() => chooseRoom(r)}
                aria-pressed={room === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="rr__group">
          <p className="rr__label">how long</p>
          <div className="rr__times" role="group" aria-label="duration">
            {TIMES.map((m) => (
              <ChoiceTile key={m} label={`${m} min`} selected={mins === m}
                onClick={() => chooseMins(m)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
