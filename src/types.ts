// Firestore 데이터 모델 타입 (designs/04-data-model.md)

export type TeamId = string // 동적 팀 (팀 문서 id)
export type EngineType = 'quiz' | 'prompt' | 'none'
export type ScoringType = 'quiz' | 'rank' | 'increment' | 'free'
export type Phase = 'intro' | 'playing' | 'result'
export type QuizScreen = 'q1' | 'q2' | 'q3'
export type PromptScreen = 'w1' | 'w2' | 'w3' | 'w4'

export interface Team {
  id: TeamId
  name: string
  color: string
  leaderId?: string // 팀장 (user name)
}

export interface User {
  name: string
  teamId: TeamId
  nickname: string | null
  passwordHash: string | null
  isAdmin: boolean
}

export interface MediaRef {
  s3Key: string
  url: string
  expiresAt: number
  contentType?: string // image/* | audio/* | video/*
}

/** 퀴즈 문제 유형 */
export type QuestionType = 'text' | 'image' | 'images' | 'audio'

export interface Game {
  id: string
  name: string
  description: string
  scoringExplanation: string
  engineType: EngineType
  scoringType: ScoringType
  totalPoints?: number
  rankPoints?: { 1: number; 2: number; 3: number }
  incrementOptions?: number[]
  rounds?: string[]
  timer?: { mode: 'countdown' | 'stopwatch'; durationSec?: number }
  order: number
  excluded?: boolean // 시작 전 진행 제외(되돌림 가능)
}

export interface Question {
  id: string
  gameId: string
  category: '과자이름' | '초성' | '확대샷' | '노래' | '영화'
  kind: 'practice' | 'real'
  qType: QuestionType
  promptText?: string
  promptMedia?: MediaRef[] // image→1 · images→N · audio→1
  answerText?: string
  answerMedia?: MediaRef // 정답 이미지 또는 영상
  points: number
  used: boolean
  order: number
}

export interface PromptSet {
  id: string
  gameId: string
  label?: string
  order: number
}

export interface Prompt {
  id: string
  setId: string
  text: string
  category: string
  order: number
}

export interface ScoreLog {
  id: string
  gameId: string
  teamId: TeamId
  points: number
  userId?: string
  questionId?: string
  promptId?: string
  round?: string
  rank?: 1 | 2 | 3
  voided: boolean
  createdBy: 'admin'
  createdAt?: unknown // Firestore Timestamp
}

export interface TimerState {
  mode: 'countdown' | 'stopwatch' | null
  status: 'idle' | 'running' | 'paused' | 'finished'
  durationSec?: number
  startedAt?: unknown // Firestore Timestamp
  accumulatedSec?: number
}

/** state/current — 진행 상태 단일 문서 */
export interface GameState {
  currentGameId: string
  phase: Phase
  finishedGameIds?: string[] // '게임 종료'된 게임들 (완료 표시)
  // 퀴즈 엔진
  currentQuestionId: string | null
  quizScreen: QuizScreen
  quizImageIndex: number // images 유형 캐러셀 인덱스
  // 제시어 엔진
  promptScreen: PromptScreen | null
  promptAssignment: Record<TeamId, string> | null
  promptTeamOrder: TeamId[] | null
  currentTeamId: TeamId | null
  currentPromptId: string | null
  // 타이머
  timer: TimerState
}
