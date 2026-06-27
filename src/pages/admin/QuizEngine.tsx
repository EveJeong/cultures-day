import { useState } from 'react'
import { useGameState, useQuestions, useTeams } from '../../lib/game'
import {
  awardQuizTeams,
  clearQuestion,
  setCurrentQuestion,
  setQuizImageIndex,
  setQuizScreen,
} from '../../lib/admin'
import type { Game, Question, QuestionType, TeamId } from '../../types'

const Q_LABEL: Record<QuestionType, string> = {
  text: '텍스트',
  image: '사진',
  images: '사진 N개',
  audio: '오디오',
}

const TEAM_IDS: TeamId[] = ['J', 'I', 'L']

export default function QuizEngine({ game }: { game: Game }) {
  const state = useGameState()
  const questions = useQuestions()
    .filter((q) => q.gameId === game.id)
    .sort((a, b) => a.order - b.order)
  const current = questions.find((q) => q.id === state?.currentQuestionId)

  if (!state) return null
  if (!current) return <QuestionList questions={questions} />
  return <QuestionRunner game={game} question={current} screen={state.quizScreen} />
}

function QuestionList({ questions }: { questions: Question[] }) {
  if (questions.length === 0)
    return <p className="font-body text-sm text-gray-400">콘텐츠 탭에서 문제를 등록하세요</p>
  return (
    <div className="space-y-1">
      <p className="font-head text-sm text-gray-500">출제할 문제 선택</p>
      {questions.map((q) => (
        <button
          key={q.id}
          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left ${
            q.used ? 'bg-gray-100 text-gray-400' : 'bg-pink-50'
          }`}
          onClick={() => setCurrentQuestion(q.id)}
        >
          <span className="truncate font-body text-sm">
            <b className="text-pink-600">[{q.category}]</b> {q.promptText}
            {q.kind === 'practice' && <span className="ml-1">(연습)</span>}
          </span>
          <span className="font-head text-xs">{q.used ? '완료' : '출제'}</span>
        </button>
      ))}
    </div>
  )
}

function QuestionRunner({
  game,
  question,
  screen,
}: {
  game: Game
  question: Question
  screen: 'q1' | 'q2' | 'q3'
}) {
  const teams = useTeams()
  const gs = useGameState()
  const imgIdx = gs?.quizImageIndex ?? 0
  const imgCount = question.promptMedia?.length ?? 0
  const [picked, setPicked] = useState<TeamId[]>([])
  const [points, setPoints] = useState(String(question.points ?? 10))

  const toggle = (id: TeamId) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))

  const register = async () => {
    if (question.kind === 'real' && picked.length > 0) {
      await awardQuizTeams(game, question.id, picked, Number(points) || question.points)
    }
    setPicked([])
    await setQuizScreen('q3')
  }

  return (
    <div className="space-y-3">
      {/* 문제/정답 미리보기 */}
      <div className="rounded-2xl bg-pink-50 p-3 text-center">
        <div className="font-head text-xs text-pink-500">
          [{question.category}] · {Q_LABEL[question.qType]} {question.kind === 'practice' && '· 연습'}
        </div>
        {question.qType === 'text' ? (
          <div className="font-display text-xl">{question.promptText}</div>
        ) : (
          <div className="font-body text-sm text-gray-500">
            {question.qType === 'images' ? `사진 ${imgCount}장` : Q_LABEL[question.qType]}
          </div>
        )}
        <div className="mt-1 font-body text-sm text-gray-500">
          정답: {question.answerText}
          {question.answerMedia ? ' (+미디어)' : ''}
        </div>
      </div>

      {/* 사진 N개 캐러셀 제어 (공개 화면과 동기화) */}
      {question.qType === 'images' && imgCount > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-mini" onClick={() => setQuizImageIndex(Math.max(0, imgIdx - 1))}>◀</button>
          <span className="font-head text-sm">{imgIdx + 1} / {imgCount}</span>
          <button className="btn-mini" onClick={() => setQuizImageIndex(Math.min(imgCount - 1, imgIdx + 1))}>▶</button>
        </div>
      )}

      {/* 화면 단계 */}
      <div className="flex justify-center gap-2">
        {(['q1', 'q2', 'q3'] as const).map((s) => (
          <button
            key={s}
            className={`btn-mini ${screen === s ? 'bg-pink-500 text-white' : ''}`}
            onClick={() => setQuizScreen(s)}
          >
            {s === 'q1' ? '문제' : s === 'q2' ? '정답공개' : '대기'}
          </button>
        ))}
      </div>

      {/* q2: 정답 팀 등록 */}
      {screen === 'q2' && question.kind === 'real' && (
        <div className="space-y-2 rounded-2xl border-2 border-pink-100 p-3">
          <p className="font-head text-sm text-pink-600">정답 팀 (복수 가능)</p>
          <div className="flex gap-2">
            {TEAM_IDS.map((id) => {
              const t = teams.find((x) => x.id === id)
              return (
                <button
                  key={id}
                  className={`btn-mini ${picked.includes(id) ? 'bg-pink-500 text-white' : ''}`}
                  onClick={() => toggle(id)}
                >
                  {t?.name ?? id}
                </button>
              )
            })}
            <input
              type="number"
              className="w-20 rounded-xl border-2 border-pink-200 p-1 font-body"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <button className="btn-mini w-full bg-pink-500 text-white" onClick={register}>
            정답 등록 ({picked.length}팀 · 각 {points}점)
          </button>
        </div>
      )}
      {screen === 'q2' && question.kind === 'practice' && (
        <p className="font-body text-sm text-gray-400">연습 문제 — 점수 미집계</p>
      )}

      <button className="btn-mini w-full" onClick={() => clearQuestion()}>
        문제 목록으로
      </button>
    </div>
  )
}
