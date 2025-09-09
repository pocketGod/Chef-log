import { Injectable, inject } from '@angular/core';
import {
  FirebaseStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getStorage
} from '@angular/fire/storage';
import { Observable } from 'rxjs';

export interface UploadProgress {
  progress: number;               // 0..100
  state: 'running' | 'success' | 'error';
  downloadURL?: string;
  error?: unknown;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private storage: FirebaseStorage = getStorage(); // inject() not required for storage

  /** Upload a file and emit progress + final downloadURL */
  upload(path: string, file: Blob | File): Observable<UploadProgress> {
    return new Observable<UploadProgress>(subscriber => {
      const r = ref(this.storage, path);
      const task = uploadBytesResumable(r, file);

      task.on(
        'state_changed',
        s => {
          const progress = Math.round((s.bytesTransferred / s.totalBytes) * 100);
          subscriber.next({ progress, state: 'running' });
        },
        err => {
          subscriber.next({ progress: 0, state: 'error', error: err });
          subscriber.complete();
        },
        async () => {
          const url = await getDownloadURL(task.snapshot.ref);
          subscriber.next({ progress: 100, state: 'success', downloadURL: url });
          subscriber.complete();
        }
      );

      return () => task.cancel();
    });
  }

  /** Get a download URL for a stored object */
  async url(path: string): Promise<string> {
    return getDownloadURL(ref(this.storage, path));
  }

  /** Delete a stored object */
  async delete(path: string): Promise<void> {
    await deleteObject(ref(this.storage, path));
  }

  /** List all object paths under a folder */
  async list(path: string): Promise<string[]> {
    const res = await listAll(ref(this.storage, path));
    return res.items.map(i => i.fullPath);
  }
}
