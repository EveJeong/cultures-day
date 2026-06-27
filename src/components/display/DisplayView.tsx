import type { TeamId } from '../../types'
import ScoreBar from './ScoreBar'
import GameView from './GameView'
import QrJoin from './QrJoin'

/** 진행 화면 본체 — 관전(중립)과 개인화(내 팀) 공용 */
export default function DisplayView({
  myTeamId,
  showQr,
}: {
  myTeamId?: TeamId | null
  showQr?: boolean
}) {
  return (
    <div className="rainbow-bg flex min-h-screen w-full flex-col">
      <ScoreBar myTeamId={myTeamId} />
      <div className="flex flex-1 items-center justify-center p-6">
        <GameView myTeamId={myTeamId} />
      </div>
      {showQr && <QrJoin />}
    </div>
  )
}
