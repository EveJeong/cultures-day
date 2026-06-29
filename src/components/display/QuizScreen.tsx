import { useGameState, useQuestions } from '../../lib/game'
import type { MediaRef } from '../../types'

/** 미디어 렌더 — 가용 영역에 맞춤. fill=true면 작은 원본도 높이에 맞춰 확대(확대샷). */
function DisplayMedia({ media, fill }: { media: MediaRef; fill?: boolean }) {
  const c = media.contentType ?? ''
  if (c.startsWith('video')) return <video src={media.url} controls className="max-h-full max-w-full rounded-2xl" />
  // 사용자/관전 화면에서는 오디오 재생 차단(운영 화면에서만 재생) — 안내만 표시
  if (c.startsWith('audio'))
    return (
      <div className="flex flex-col items-center gap-2 text-pink-500">
        <span className="text-7xl md:text-8xl">🎧</span>
        <span className="font-head text-2xl">오디오 문제</span>
      </div>
    )
  const imgCls = fill
    ? 'h-full w-full rounded-2xl object-contain' // 업스케일(작은 원본도 크게)
    : 'max-h-full max-w-full rounded-2xl object-contain' // 축소만(원본 유지)
  return <img src={media.url} alt="" className={imgCls} />
}

/** 퀴즈 참가자 화면 q1(문제)·q2(정답)·q3(대기) */
export default function QuizScreen() {
  const state = useGameState()
  const question = useQuestions().find((q) => q.id === state?.currentQuestionId)

  if (!state || !question) return <p className="wordart wordart-white text-4xl">준비 중…</p>
  if (state.quizScreen === 'q3') return <p className="wordart wordart-white text-5xl">준비해주세요!</p>

  const media = question.promptMedia ?? []
  const idx = Math.min(state.quizImageIndex ?? 0, Math.max(0, media.length - 1))
  const isMedia = question.qType !== 'text'
  // 확대샷: 작은 원본도 높이에 맞춰 확대
  const zoom = question.category === '확대샷'
  // 사진/오디오 문제는 정답 화면(q2)에서 문제를 숨김 (텍스트는 유지)
  const showPrompt = state.quizScreen === 'q1' || question.qType === 'text'

  return (
    <div className="flex h-full max-h-full min-h-0 w-full max-w-5xl flex-col items-center justify-center gap-2 text-center">
      <div className="shrink-0 rounded-full bg-white/90 px-6 py-1.5 font-head text-2xl text-pink-600">
        {question.category}
        {question.kind === 'practice' && ' · 연습'}
      </div>

      {showPrompt && (
        <div className={`flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-white/90 shadow-2xl ${isMedia ? 'p-3' : 'p-6'}`}>
          <div className="flex min-h-0 w-full flex-1 items-center justify-center">
            {question.qType === 'text' && (
              <p className="font-display text-5xl text-gray-800 md:text-6xl">{question.promptText}</p>
            )}
            {(question.qType === 'image' || question.qType === 'audio') && media[0] && (
              <DisplayMedia media={media[0]} fill={zoom} />
            )}
            {question.qType === 'images' && media[idx] && <DisplayMedia media={media[idx]} fill={zoom} />}
          </div>
          {question.qType === 'images' && media.length > 0 && (
            <p className="shrink-0 font-head text-2xl text-pink-500">{idx + 1} / {media.length}</p>
          )}
        </div>
      )}

      {state.quizScreen === 'q2' && (
        <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-2 rounded-3xl bg-yellow-300 p-3 shadow-2xl">
          <p className="shrink-0 font-head text-xl text-pink-700">정답</p>
          {question.answerMedia && (
            <div className="flex min-h-0 w-full flex-1 items-center justify-center">
              <DisplayMedia media={question.answerMedia} />
            </div>
          )}
          {question.answerText && (
            <p className="wordart wordart-blue shrink-0 text-5xl md:text-6xl">{question.answerText}</p>
          )}
        </div>
      )}
    </div>
  )
}
