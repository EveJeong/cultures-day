import { useNavigate, useParams } from 'react-router-dom'
import {
  useGames,
  useQuestions,
  useReps,
  useScoreLog,
  useTeams,
  useUsers,
  userEvents,
  userMvps,
  userQuizzes,
  userTotal,
} from '../lib/game'
import Logo from '../components/Logo'
import { Panel } from './admin/ui'

/** 참여자 상세 — 개인 페이지·운영자·팀원 공용. 기여 점수·맞춘 퀴즈·참가 종목·MVP */
export default function ParticipantDetailPage() {
  const { name: raw } = useParams()
  const name = raw ? decodeURIComponent(raw) : ''
  const nav = useNavigate()

  const users = useUsers()
  const teams = useTeams()
  const games = useGames()
  const questions = useQuestions()
  const log = useScoreLog()
  const reps = useReps()

  const user = users.find((u) => u.name === name)
  const team = teams.find((t) => t.id === user?.teamId)
  const gameName = (id: string) => games.find((g) => g.id === id)?.name ?? id

  const total = userTotal(log, name)
  const quizzes = userQuizzes(log, name)
  const events = userEvents(reps, log, name)
  const mvps = userMvps(log, name)

  return (
    <div className="rainbow-bg min-h-screen w-full p-4">
      <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
        <div className="flex items-center justify-between">
          <button className="rounded-full bg-white/90 px-4 py-1.5 font-head text-pink-600 shadow" onClick={() => nav(-1)}>
            ← 뒤로
          </button>
          <Logo size="sm" />
        </div>

        {!user ? (
          <Panel><p className="font-body text-gray-500">참여자를 찾을 수 없어요.</p></Panel>
        ) : (
          <>
            <Panel>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-display text-2xl" style={{ color: team?.color ?? '#333' }}>{user.name}</div>
                  <div className="font-body text-sm text-gray-500">
                    {team?.name ?? '팀 미지정'}
                    {user.nickname && ` · ${user.nickname}`}
                    {team?.leaderId === user.name && <span className="ml-1 text-pink-600">👑 팀장</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-head text-xs text-gray-400">내 기여 점수</div>
                  <div className="font-display text-3xl text-pink-600">{total}</div>
                </div>
              </div>
            </Panel>

            <Panel>
              <h2 className="mb-2 font-head text-pink-600">🧠 맞춘 퀴즈 ({quizzes.length})</h2>
              {quizzes.length === 0 ? (
                <p className="font-body text-sm text-gray-400">아직 없어요</p>
              ) : (
                <div className="space-y-1">
                  {quizzes.map((e) => {
                    const q = questions.find((x) => x.id === e.questionId)
                    return (
                      <div key={e.id} className="flex items-center justify-between rounded-lg bg-pink-50 px-3 py-1.5 font-body text-sm">
                        <span className="min-w-0 truncate">
                          {q ? <b className="text-pink-600">[{q.category}]</b> : null} {q?.answerText ?? gameName(e.gameId)}
                        </span>
                        <b className="text-pink-600">+{e.points}</b>
                      </div>
                    )
                  })}
                </div>
              )}
            </Panel>

            <Panel>
              <h2 className="mb-2 font-head text-pink-600">🎯 참가 종목 ({events.length})</h2>
              {events.length === 0 ? (
                <p className="font-body text-sm text-gray-400">아직 없어요</p>
              ) : (
                <div className="space-y-1">
                  {events.map((ev, i) => (
                    <div key={`${ev.gameId}-${ev.round}-${i}`} className="flex items-center justify-between rounded-lg bg-pink-50 px-3 py-1.5 font-body text-sm">
                      <span className="min-w-0 truncate">
                        <b className="text-pink-600">{gameName(ev.gameId)}</b>
                        {ev.round !== 'main' && <span className="text-gray-500"> · {ev.round}</span>}
                      </span>
                      {ev.rank ? (
                        <b className="text-pink-600">{ev.rank}등 +{ev.points}</b>
                      ) : (
                        <span className="text-xs text-gray-400">결과 대기</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {mvps.length > 0 && (
              <Panel>
                <h2 className="mb-2 font-head text-pink-600">🏅 MVP ({mvps.length})</h2>
                <div className="space-y-1">
                  {mvps.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-lg bg-yellow-100 px-3 py-1.5 font-body text-sm">
                      <span className="min-w-0 truncate font-head text-pink-700">🏅 {gameName(e.gameId)} MVP</span>
                      <b className="text-pink-600">+{e.points}</b>
                    </div>
                  ))}
                </div>
              </Panel>
            )}
          </>
        )}
      </div>
    </div>
  )
}
