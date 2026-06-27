// 콘텐츠(퀴즈 문제 · 제시어) CRUD 헬퍼. 이미지(S3)는 추후 별도 청크.
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Prompt, Question } from '../types'

function requireDb() {
  if (!db) throw new Error('Firestore 미설정')
  return db
}

/* 퀴즈 문제 */
export async function addQuestion(data: Omit<Question, 'id'>) {
  await addDoc(collection(requireDb(), 'questions'), data)
}
export async function updateQuestion(id: string, patch: Partial<Question>) {
  await updateDoc(doc(requireDb(), 'questions', id), patch)
}
export async function deleteQuestion(id: string) {
  await deleteDoc(doc(requireDb(), 'questions', id))
}

/* 제시어 묶음 */
export async function addPromptSet(gameId: string, label: string, order: number) {
  await addDoc(collection(requireDb(), 'promptSets'), { gameId, label, order })
}
export async function deletePromptSet(id: string) {
  await deleteDoc(doc(requireDb(), 'promptSets', id))
}

/* 제시어 */
export async function addPrompt(data: Omit<Prompt, 'id'>) {
  await addDoc(collection(requireDb(), 'prompts'), data)
}
export async function deletePrompt(id: string) {
  await deleteDoc(doc(requireDb(), 'prompts', id))
}
