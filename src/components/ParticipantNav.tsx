import { Link } from 'react-router-dom'
import { useTeams, useUsers } from '../lib/game'
import type { Session } from '../lib/auth'

/** 참여자 진행 화면 위 코너 버튼 — 내 기여 / (팀장) 팀장 메뉴 */
export default function ParticipantNav({ session }: { session: Session }) {
  const teams = useTeams()
  const me = useUsers().find((u) => u.name === session.userId)
  const isLeader = teams.some((t) => t.id === me?.teamId && t.leaderId === me?.name)

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      <Link
        to={`/u/${encodeURIComponent(session.userId)}`}
        className="rounded-full bg-white/90 px-4 py-2 font-head text-sm text-pink-600 shadow-lg"
      >
        🙋 내 기여
      </Link>
      {isLeader && (
        <Link
          to="/leader"
          className="rounded-full bg-yellow-300 px-4 py-2 font-head text-sm text-pink-700 shadow-lg"
        >
          👑 팀장
        </Link>
      )}
    </div>
  )
}
