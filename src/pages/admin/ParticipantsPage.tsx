import UserTeamPanel from './UserTeamPanel'

// 참가자 관리 — 팀/참여자. (팀 상세·동적 팀은 다음 단계에서 확장)
export default function ParticipantsPage() {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <UserTeamPanel />
    </div>
  )
}
