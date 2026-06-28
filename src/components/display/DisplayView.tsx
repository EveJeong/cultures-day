import type { TeamId } from '../../types'
import { useGameState } from '../../lib/game'
import ScoreBar from './ScoreBar'
import GameView from './GameView'
import QrJoin from './QrJoin'
import WaitingScreen from './WaitingScreen'

/** 진행 화면 본체 — 관전(중립)과 개인화(내 팀) 공용 */
export default function DisplayView({
  myTeamId,
  showQr,
}: {
  myTeamId?: TeamId | null
  showQr?: boolean
}) {
  const state = useGameState()

  // 대기 상태: 로고 + 다음 게임 힌트 + 변동 리더보드
  if (state?.waiting) {
    return (
      <div className="rainbow-bg flex h-screen w-full flex-col overflow-hidden">
        <WaitingScreen myTeamId={myTeamId} />
        {showQr && <QrJoin />}
      </div>
    )
  }

  return (
    <div className="rainbow-bg flex h-screen w-full flex-col overflow-hidden">
      <ScoreBar myTeamId={myTeamId} />
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-6">
        <GameView myTeamId={myTeamId} />
      </div>
      {showQr && <QrJoin />}
    </div>
  )
}
