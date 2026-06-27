// 운영자 계정 부트스트랩. 실행: node scripts/seed-admin.mjs [비밀번호]
// 기본 비번 'admin1234' — 로그인 후 설정 탭에서 변경 권장.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY, authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID, appId: env.VITE_FIREBASE_APP_ID,
})
const db = getFirestore(app)

const password = process.argv[2] || 'admin1234'
const passwordHash = createHash('sha256').update(password).digest('hex')

await setDoc(doc(db, 'users', 'admin'), {
  name: 'admin', teamId: 'J', nickname: null, isAdmin: true, passwordHash,
})
console.log(`admin 계정 설정됨 (이름: admin, 비번: ${password})`)
process.exit(0)
