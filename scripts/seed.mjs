// Firestore 시드: 팀 3 + 게임 9 프리셋 + 초기 state.
// 실행: node scripts/seed.mjs
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

// .env.local 파싱
const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

const teams = [
  { id: 'J', name: 'J팀', color: '#e84393' },
  { id: 'I', name: 'I팀', color: '#0984e3' },
  { id: 'L', name: 'L팀', color: '#00b894' },
]

const games = [
  { id: 'quiz', name: '퀴즈', engineType: 'quiz', scoringType: 'quiz', order: 1,
    scoringExplanation: '문제 1개당 10점, 맞춘 사람의 팀이 획득' },
  { id: 'charades', name: '릴레이 몸으로 말해요', engineType: 'prompt', scoringType: 'increment',
    incrementOptions: [10], order: 2, scoringExplanation: '정답 1개당 점수 획득' },
  { id: 'draw-relay', name: '이어서 그리기', engineType: 'prompt', scoringType: 'increment',
    incrementOptions: [50], timer: { mode: 'countdown', durationSec: 1200 }, order: 3,
    scoringExplanation: '맞출 때마다 50점' },
  { id: 'liar', name: '라이어게임', engineType: 'none', scoringType: 'free', order: 4,
    scoringExplanation: '운영자가 팀별 점수 배분' },
  { id: 'snack-taste', name: '과자 맞추기(미각)', engineType: 'none', scoringType: 'increment',
    incrementOptions: [20], order: 5, scoringExplanation: '1개 맞출 때마다 20점' },
  { id: 'yut', name: '윷놀이 + 훈민정음', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 200, 2: 100, 3: 50 }, timer: { mode: 'countdown', durationSec: 1800 },
    rounds: [], order: 6, scoringExplanation: '순위별 200 / 100 / 50점' },
  { id: 'board', name: '보드게임', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 100, 2: 50, 3: 10 }, rounds: ['루미큐브', '로보77', '할리갈리'], order: 7,
    scoringExplanation: '게임별 순위 100 / 50 / 10점' },
  { id: 'relay', name: '릴레이 게임', engineType: 'none', scoringType: 'rank',
    rankPoints: { 1: 200, 2: 100, 3: 50 }, timer: { mode: 'stopwatch' }, order: 8,
    scoringExplanation: '순위별 200 / 100 / 50점' },
  { id: 'bottlecap', name: '병뚜껑 컬링', engineType: 'none', scoringType: 'free', order: 9,
    scoringExplanation: '운영자 자유 배점' },
]

const state = {
  currentGameId: 'quiz',
  phase: 'intro', finishedGameIds: [],
  currentQuestionId: null,
  quizScreen: 'q1', quizImageIndex: 0,
  promptScreen: null,
  promptAssignment: null,
  promptTeamOrder: null,
  currentTeamId: null,
  currentPromptId: null,
  timer: { mode: null, status: 'idle' },
}

async function main() {
  for (const t of teams) await setDoc(doc(db, 'teams', t.id), t)
  for (const g of games) await setDoc(doc(db, 'games', g.id), { description: '', ...g })
  await setDoc(doc(db, 'state', 'current'), state)
  console.log(`seeded: ${teams.length} teams, ${games.length} games, state/current`)
  process.exit(0)
}
main().catch((e) => {
  console.error('seed failed:', e?.message || e)
  process.exit(1)
})
