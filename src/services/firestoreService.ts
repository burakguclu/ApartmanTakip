import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  type DocumentSnapshot,
  type QueryConstraint,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { getCurrentTimestamp } from '@/utils/helpers';

/**
 * Generic Firestore service for CRUD operations
 */

export async function createDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: getCurrentTimestamp(),
    updatedAt: getCurrentTimestamp(),
    isDeleted: false,
  });
  return docRef.id;
}

export async function updateDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: getCurrentTimestamp(),
  });
}

export async function softDeleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    isDeleted: true,
    updatedAt: getCurrentTimestamp(),
  });
}

export async function hardDeleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export async function getDocument<T>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
}

export async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const q = query(
    collection(db, collectionName),
    where('isDeleted', '==', false),
    ...constraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
}

export async function getDocumentsByField<T>(
  collectionName: string,
  fieldName: string,
  fieldValue: string | number | boolean,
  additionalConstraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const q = query(
    collection(db, collectionName),
    where('isDeleted', '==', false),
    where(fieldName, '==', fieldValue),
    ...additionalConstraints
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
}

export async function getPaginatedDocuments<T>(
  collectionName: string,
  pageSize: number,
  lastDoc: DocumentSnapshot | null,
  constraints: QueryConstraint[] = []
): Promise<{ data: (T & { id: string })[]; lastDoc: DocumentSnapshot | null }> {
  const baseConstraints: QueryConstraint[] = [
    where('isDeleted', '==', false),
    ...constraints,
    orderBy('createdAt', 'desc'),
    limit(pageSize),
  ];

  if (lastDoc) {
    baseConstraints.push(startAfter(lastDoc));
  }

  const q = query(collection(db, collectionName), ...baseConstraints);
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T & { id: string });
  const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

  return { data, lastDoc: newLastDoc };
}

export async function batchCreateDocuments<T extends Record<string, unknown>>(
  collectionName: string,
  items: T[]
): Promise<string[]> {
  const batch = writeBatch(db);
  const ids: string[] = [];
  const now = getCurrentTimestamp();

  for (const item of items) {
    const docRef = doc(collection(db, collectionName));
    batch.set(docRef, {
      ...item,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    });
    ids.push(docRef.id);
  }

  await batch.commit();
  return ids;
}

export async function countDocuments(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<number> {
  const q = query(
    collection(db, collectionName),
    where('isDeleted', '==', false),
    ...constraints
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export { serverTimestamp, query, where, orderBy, limit, collection, doc };
