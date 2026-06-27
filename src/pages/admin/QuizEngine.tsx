import { useEffect, useState } from 'react'
import { useGameState, useQuestions, useTeams } from '../../lib/game'
import {
  awardQuizTeams,
  setCurrentQuestion,
  setPhase,
  setQuizImageIndex,
  setQuizScreen,
} from '../../lib/admin'
import type { Game, MediaRef, Question, TeamId } from '../../types'

/** 운영 화면용 미디어 렌더 */
function AdminMedia({ media }: { media: MediaRef }) {
  const c = media.contentType ?? ''
  if (c.startsWith('video')) return <video src={media.url} controls className="max-h-56 rounded-xl" />
  if (c.startsWith('audio')) return <audio src={media.url} controls className="w-full" />
  return <img src={media.url} alt="" className="max-h-56 rounded-xl object-contain" />
}

/** 퀴즈 진행 — 순서대로 자동 진행, 단계별 화면 하나씩 (designs/02 §4) */
export default function QuizEngine({ game }: { game: Game }) {
  const state = useGameState()
  const questions = useQuestions()
    .filter((q) => q.gameId === game.id)
    .sort((a, b) => a.order - b.order)
  const current = questions.find((q) => q.id === state?.currentQuestionId)

  // 진행 단계 진입 시 첫 문제 자동 표시 (순서대로)
  useEffect(() => {
    if (state && !state.currentQuestionId && questions.length > 0) {
      setCurrentQuestion(questions[0].id)
    }
  }, [state, questions])

  if (!state) return null
  if (questions.length === 0)
    return <p className="font-body text-sm text-gray-400">콘텐츠에서 문제를 등록하세요</p>
  if (!current) return <p className="font-body text-sm text-gray-400">준비 중…</p>

  return (
    <QuestionRunner
      key={current.id}
      game={game}
      question={current}
      questions={questions}
      screen={state.quizScreen}
      imgIdx={state.quizImageIndex ?? 0}
    />
  )
}

function QuestionRunner({
  game,
  question,
  questions,
  screen,
  imgIdx,
}: {
  game: Game
  question: Question
  questions: Question[]
  screen: 'q1' | 'q2' | 'q3'
  imgIdx: number
}) {
  const teams = useTeams()
  const [picked, setPicked] = useState<TeamId[]>([])
  const [points, setPoints] = useState(String(question.points ?? 10))

  const idx = questions.findIndex((q) => q.id === question.id)
  const hasNext = idx < questions.length - 1
  const media = question.promptMedia ?? []
  const isPractice = question.kind === 'practice'

  const toggle = (id: TeamId) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const register = async () => {
    if (!isPractice && picked.length > 0) {
      await awardQuizTeams(game, question.id, picked, Number(points) || question.points)
    }
    await setQuizScreen('q3')
  }

  const goNext = async () => {
    if (hasNext) await setCurrentQuestion(questions[idx + 1].id)
    else await setPhase('result')
  }

  return (
    <div className="space-y-3">
      <div className="text-center font-head text-xs text-gray-400">
        문제 {idx + 1} / {questions.length}
      </div>

      {/* 문제 + 정답 (운영자만 정답 봄) — q1·q2에서 표시 */}
      {screen !== 'q3' && (
        <div className="rounded-2xl bg-white p-4 text-center shadow">
          <div className="font-head text-xs text-pink-500">
            [{question.category}] {isPractice && '· 연습'}
          </div>
          <div className="my-3 flex flex-col items-center gap-2">
            {question.qType === 'text' && (
              <p className="font-display text-3xl text-gray-800">{question.promptText}</p>
            )}
            {(question.qType === 'image' || question.qType === 'audio') && media[0] && (
              <AdminMedia media={media[0]} />
            )}
            {question.qType === 'images' && media[imgIdx] && (
              <>
                <AdminMedia media={media[imgIdx]} />
                <div className="flex items-center gap-3">
                  <button className="btn-mini" onClick={() => setQuizImageIndex(Math.max(0, imgIdx - 1))}>◀</button>
                  <span className="font-head text-sm">{imgIdx + 1} / {media.length}</span>
                  <button className="btn-mini" onClick={() => setQuizImageIndex(Math.min(media.length - 1, imgIdx + 1))}>▶</button>
                </div>
              </>
            )}
          </div>
          <div className="rounded-xl bg-yellow-100 px-3 py-2">
            <span className="font-head text-pink-700">정답: </span>
            <span className="font-display text-xl">{question.answerText}</span>
            {question.answerMedia && (
              <div className="mt-2 flex justify-center"><AdminMedia media={question.answerMedia} /></div>
            )}
          </div>
        </div>
      )}

      {/* 단계별 액션 */}
      {screen === 'q1' && (
        <button className="btn-mini w-full bg-pink-500 text-white" onClick={() => setQuizScreen('q2')}>
          {isPractice ? '정답 공개 →' : '정답 공개 · 정답자 등록 →'}
        </button>
      )}

      {screen === 'q2' && !isPractice && (
        <div className="space-y-2 rounded-2xl border-2 border-pink-100 p-3">
          <p className="font-head text-sm text-pink-600">정답 팀 선택 (복수 가능)</p>
          <div className="flex flex-wrap items-center gap-2">
            {teams.map((t) => (
              <button
                key={t.id}
                className={`btn-mini ${picked.includes(t.id) ? 'bg-pink-500 text-white' : ''}`}
                onClick={() => toggle(t.id)}
              >
                {t.name}
              </button>
            ))}
            <input
              type="number"
              className="w-20 rounded-xl border-2 border-pink-200 p-1 font-body"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <button className="btn-mini w-full bg-pink-500 text-white" onClick={register}>
            등록 ({picked.length}팀 · 각 {points}점) →
          </button>
        </div>
      )}
      {screen === 'q2' && isPractice && (
        <button className="btn-mini w-full bg-pink-500 text-white" onClick={() => setQuizScreen('q3')}>
          다음으로 → (연습, 점수 미집계)
        </button>
      )}

      {screen === 'q3' && (
        <div className="rounded-2xl bg-pink-50 p-4 text-center">
          <p className="font-head text-pink-600">문제 {idx + 1} 완료!</p>
          <button className="btn-mini mt-2 w-full bg-pink-500 text-white" onClick={goNext}>
            {hasNext ? '다음 문제 →' : '퀴즈 종료 (결과)'}
          </button>
        </div>
      )}
    </div>
  )
}
