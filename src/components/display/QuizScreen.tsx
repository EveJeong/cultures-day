import { useGameState, useQuestions } from '../../lib/game'
import type { MediaRef } from '../../types'

/** 미디어 렌더 — contentType 따라 img/audio/video (재생 버튼=controls) */
function DisplayMedia({ media, big, zoom }: { media: MediaRef; big?: boolean; zoom?: boolean }) {
  const c = media.contentType ?? ''
  // 확대샷(zoom)은 화면 거의 꽉 차게
  const imgCls = zoom
    ? 'max-h-[85vh] w-full rounded-2xl object-contain'
    : big
      ? 'max-h-[55vh] rounded-2xl object-contain'
      : 'max-h-[40vh] rounded-2xl object-contain'
  if (c.startsWith('video')) return <video src={media.url} controls className={big ? 'max-h-[55vh] rounded-2xl' : 'max-h-[40vh] rounded-2xl'} />
  if (c.startsWith('audio')) return <audio src={media.url} controls className="w-80 md:w-[28rem]" />
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
  // 확대샷: 이미지 문제를 화면 거의 꽉 차게
  const zoom = question.category === '확대샷' && (question.qType === 'image' || question.qType === 'images')

  return (
    <div className={`flex w-full flex-col items-center gap-4 text-center ${zoom ? 'max-w-6xl' : 'max-w-4xl gap-6'}`}>
      <div className="rounded-full bg-white/90 px-6 py-2 font-head text-2xl text-pink-600">
        {question.category}
        {question.kind === 'practice' && ' · 연습'}
      </div>

      <div className={`flex w-full flex-col items-center gap-4 rounded-3xl bg-white/90 shadow-2xl ${zoom ? 'p-2' : 'p-8'}`}>
        {question.qType === 'text' && (
          <p className="font-display text-6xl text-gray-800">{question.promptText}</p>
        )}
        {question.qType === 'image' && media[0] && <DisplayMedia media={media[0]} big zoom={zoom} />}
        {question.qType === 'audio' && media[0] && <DisplayMedia media={media[0]} />}
        {question.qType === 'images' && media.length > 0 && (
          <>
            <DisplayMedia media={media[idx]} big zoom={zoom} />
            <p className="font-head text-2xl text-pink-500">
              {idx + 1} / {media.length}
            </p>
          </>
        )}
      </div>

      {state.quizScreen === 'q2' && (
        <div className="flex w-full flex-col items-center gap-3 rounded-3xl bg-yellow-300 p-8 shadow-2xl">
          <p className="font-head text-xl text-pink-700">정답</p>
          {question.answerMedia && <DisplayMedia media={question.answerMedia} big />}
          {question.answerText && <p className="wordart wordart-blue text-6xl">{question.answerText}</p>}
        </div>
      )}
    </div>
  )
}
