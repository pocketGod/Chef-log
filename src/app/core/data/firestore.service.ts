import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  docData,
  collectionData,
  QueryConstraint,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export type Id = string;
export type WithId<T> = T & { id: Id };

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private db = inject(Firestore);

  /** Build a typed collection ref */
  col<T = unknown>(path: string) {
    return collection(this.db, path) as ReturnType<typeof collection>;
  }

  /** Build a typed doc ref */
  ref<T = unknown>(path: string) {
    return doc(this.db, path);
  }

  /** Live list by id */
  list$<T = unknown>(path: string, ...q: QueryConstraint[]): Observable<WithId<T>[]> {
    const c = this.col<T>(path);
    const qref = q.length ? query(c, ...q) : c;
    return collectionData(qref, { idField: 'id' }) as Observable<WithId<T>[]>;
  }

  /** Live single doc */
  doc$<T = unknown>(path: string): Observable<T | undefined> {
    return docData(this.ref<T>(path), { idField: 'id' }) as Observable<T | undefined>;
  }

  /** One-shot list (Promise) */
  async listOnce<T = unknown>(path: string, ...q: QueryConstraint[]): Promise<WithId<T>[]> {
    const c = this.col<T>(path);
    const qref = q.length ? query(c, ...q) : c;
    const snap = await getDocs(qref);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as T) }));
  }

  /** One-shot get doc (Promise) */
  async get<T = unknown>(path: string): Promise<WithId<T> | undefined> {
    const s = await getDoc(this.ref<T>(path));
    return s.exists() ? { id: s.id, ...(s.data() as T) } : undefined;
  }

  /** Add to a collection; returns new id */
  async add<T = unknown>(path: string, data: T): Promise<Id> {
    const r = await addDoc(this.col<T>(path), data as any);
    return r.id;
  }

  /** Create */
  async set<T = unknown>(path: string, data: T, opts: { merge?: boolean } = {}) {
    await setDoc(this.ref<T>(path), data as any, opts);
  }

  /** Update */
  async update<T = Partial<unknown>>(path: string, data: T) {
    await updateDoc(this.ref(path), data as any);
  }

  /** Delete */
  async remove(path: string) {
    await deleteDoc(this.ref(path));
  }

  // re-exports for callers
  where = where;
  orderBy = orderBy;
  limit = limit;
  startAfter = startAfter;
}
