import { useNavigate, useParams } from 'react-router-dom'
import { Panel } from './ui'

// 팀 상세 — 점수·이력·팀원·팀장. (다음 단계에서 구현)
export default function TeamDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  return (
    <Panel>
      <button className="btn-mini" onClick={() => nav('/admin/participants')}>← 참가자 관리</button>
      <p className="mt-2 font-body text-gray-500">팀 상세({id}) — 점수·이력·팀원·팀장 (다음 단계)</p>
    </Panel>
  )
}
