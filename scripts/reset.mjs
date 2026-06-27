// 점수 초기화: scoreLog 전체 삭제 + state/current를 첫 게임 intro로 리셋.
// (팀·게임 정의는 유지) 실행: node scripts/reset.mjs
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  doc,
  setDoc,
} from 'firebase/firestore'

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

async function main() {
  const snap = await getDocs(collection(db, 'scoreLog'))
  await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  await setDoc(doc(db, 'state', 'current'), {
    currentGameId: 'quiz',
    phase: 'intro',
    currentQuestionId: null,
    quizScreen: 'q1', quizImageIndex: 0,
    promptScreen: null,
    promptAssignment: null,
    promptTeamOrder: null,
    currentTeamId: null,
    currentPromptId: null,
    timer: { mode: null, status: 'idle' },
  })
  console.log(`reset: deleted ${snap.size} scoreLog, state → quiz/intro`)
  process.exit(0)
}
main().catch((e) => {
  console.error('reset failed:', e?.message || e)
  process.exit(1)
})
