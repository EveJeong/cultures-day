import { useGameState, useQuestions } from '../../lib/game'

/** 퀴즈 참가자 화면 q1(문제)·q2(정답)·q3(대기) */
export default function QuizScreen() {
  const state = useGameState()
  const question = useQuestions().find((q) => q.id === state?.currentQuestionId)

  if (!state || !question) {
    return <p className="wordart wordart-white text-4xl">준비 중…</p>
  }

  const screen = state.quizScreen

  if (screen === 'q3') {
    return <p className="wordart wordart-white text-5xl">준비해주세요!</p>
  }

  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-6 text-center">
      <div className="rounded-full bg-white/90 px-6 py-2 font-head text-2xl text-pink-600">
        {question.category}
        {question.kind === 'practice' && ' · 연습'}
      </div>

      <div className="flex w-full flex-col items-center gap-4 rounded-3xl bg-white/90 p-10 shadow-2xl">
        {question.promptImage && (
          <img src={question.promptImage.url} alt="" className="max-h-[40vh] rounded-2xl object-contain" />
        )}
        {question.promptText && (
          <p className="font-display text-6xl text-gray-800">{question.promptText}</p>
        )}
      </div>

      {screen === 'q2' && (
        <div className="flex w-full flex-col items-center gap-3 rounded-3xl bg-yellow-300 p-8 shadow-2xl">
          <p className="font-head text-xl text-pink-700">정답</p>
          {question.answerImage && (
            <img src={question.answerImage.url} alt="" className="max-h-[40vh] rounded-2xl object-contain" />
          )}
          {question.answerText && <p className="wordart wordart-blue text-6xl">{question.answerText}</p>}
        </div>
      )}
    </div>
  )
}
