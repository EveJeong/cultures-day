// 게임 정의 관리(CRUD) + 기본 프리셋. (사용자·팀 관리는 추후 A에서 추가)
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { Game } from '../types'

function requireDb() {
  if (!db) throw new Error('Firestore 미설정')
  return db
}

/** 게임 저장(전체 교체 → 유형 변경 시 stale 필드 정리) */
export async function saveGame(id: string, data: Omit<Game, 'id'>) {
  await setDoc(doc(requireDb(), 'games', id), data)
}

export async function deleteGame(id: string) {
  await deleteDoc(doc(requireDb(), 'games', id))
}

export function newGameId(): string {
  return `g-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
}

/** 기본 9게임 프리셋 — 존재하지 않는 것만 생성, 추가 건수 반환 */
export async function loadPresetGames(): Promise<number> {
  let added = 0
  for (const g of PRESET_GAMES) {
    const { id, ...data } = g
    const ref = doc(requireDb(), 'games', id)
    const snap = await getDoc(ref)
    if (snap.exists()) continue
    await setDoc(ref, data)
    added++
  }
  return added
}

export const PRESET_GAMES: Game[] = [
  { id: 'quiz', name: '퀴즈', description: '', engineType: 'quiz', scoringType: 'quiz', order: 1,
    scoringExplanation: '문제 1개당 10점, 맞춘 사람의 팀이 획득' },
  { id: 'charades', name: '릴레이 몸으로 말해요', description: '', engineType: 'prompt', scoringType: 'increment',
    incrementOptions: [10], order: 2, scoringExplanation: '정답 1개당 점수 획득' },
  { id: 'draw-relay', name: '이어서 그리기', description: '', engineType: 'prompt', scoringType: 'increment',
    incrementOptions: [50], timer: { mode: 'countdown', durationSec: 1200 }, order: 3,
    scoringExplanation: '맞출 때마다 50점' },
  { id: 'liar', name: '라이어게임', description: '', engineType: 'none', scoringType: 'free', order: 4,
    scoringExplanation: '운영자가 팀별 점수 배분' },
  { id: 'snack-taste', name: '과자 맞추기(미각)', description: '', engineType: 'none', scoringType: 'increment',
    incrementOptions: [20], order: 5, scoringExplanation: '1개 맞출 때마다 20점' },
  { id: 'yut', name: '윷놀이 + 훈민정음', description: '', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 200, 2: 100, 3: 50 }, timer: { mode: 'countdown', durationSec: 1800 }, order: 6,
    scoringExplanation: '순위별 200 / 100 / 50점' },
  { id: 'board', name: '보드게임', description: '', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 100, 2: 50, 3: 10 }, rounds: ['루미큐브', '로보77', '할리갈리'], order: 7,
    scoringExplanation: '게임별 순위 100 / 50 / 10점' },
  { id: 'relay', name: '릴레이 게임', description: '', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 200, 2: 100, 3: 50 }, timer: { mode: 'stopwatch' }, order: 8,
    scoringExplanation: '순위별 200 / 100 / 50점' },
  { id: 'bottlecap', name: '병뚜껑 컬링', description: '', engineType: 'none', scoringType: 'free', order: 9,
    scoringExplanation: '운영자 자유 배점' },
]
