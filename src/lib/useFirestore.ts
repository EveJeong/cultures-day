import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  type QueryConstraint,
} from 'firebase/firestore'
import { db } from './firebase'

/** 단일 문서 실시간 구독. id를 doc 데이터에 합쳐 반환. */
export function useDocument<T>(path: string, id: string): T | null {
  const [data, setData] = useState<T | null>(null)

  useEffect(() => {
    if (!db) return
    const ref = doc(db, path, id)
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setData(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : null)
      },
      (err) => console.error(`[useDocument ${path}/${id}]`, err.message),
    )
    return unsub
  }, [path, id])

  return data
}

/** 컬렉션 실시간 구독. 각 문서에 id 합쳐 배열 반환. */
export function useCollection<T>(
  path: string,
  ...constraints: QueryConstraint[]
): T[] {
  const [items, setItems] = useState<T[]>([])

  // constraints는 매 렌더 새 배열이라 직렬화로 의존성 고정
  const key = constraints.map((c) => c.type).join(',')

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, path), ...constraints)
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T))
      },
      (err) => console.error(`[useCollection ${path}]`, err.message),
    )
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key])

  return items
}
