export type AuthPhase = 'unconfigured' | 'restoring' | 'guest' | 'account' | 'expired' | 'error';
export type SaveState = 'localSaved' | 'syncing' | 'cloudSynced' | 'offlineQueued' | 'error' | 'conflict' | 'unsaved';
export interface AccountIdentity { uid: string; email: string | null; provider: string | null; displayName: string | null }
export interface CloudRow { shrineId: string; completed: boolean; revision: number; updatedAt: string }
export interface SyncConflict { shrineId: string; localCompleted: boolean; remote: CloudRow; baseRevision: number; requestId: string }
export interface AccountError { operation: 'auth' | 'sync' | 'storage' | 'transfer'; code: string; retryable: boolean }
export interface TransferSource { kind: 'guest' | 'json'; completedIds: readonly string[]; raw?: string }
export interface TransferBackup {
  id: string; uid: string; game: 'botw'; dataVersion: string; createdAt: string;
  sourceKind: 'guest' | 'json' | 'restore'; sourceCompletedIds: readonly string[];
  sourceRaw: string | null; accountCompletedIds: readonly string[];
}
export interface TransferPreview {
  id: string; uid: string; sourceKind: 'guest' | 'json' | 'restore';
  sourceCount: number; cloudCount: number; overlapCount: number; mergeCount: number; replaceCount: number;
  mergeAddedIds: readonly string[]; replaceAddedIds: readonly string[]; replaceRemovedIds: readonly string[];
  backup: TransferBackup; hasChanges: { merge: boolean; replace: boolean };
}
export interface AccountSnapshot {
  authPhase: AuthPhase; identity: AccountIdentity | null; ready: boolean;
  completedIds: readonly string[]; saveState: SaveState; pendingCount: number;
  conflicts: readonly SyncConflict[]; error: AccountError | null; backups: readonly TransferBackup[];
}
export interface AccountProgressController {
  getSnapshot(): AccountSnapshot; subscribe(listener: () => void): () => void;
  start(): Promise<void>; dispose(): void;
  signUpEmailPassword(email: string, password: string): Promise<void>;
  signInEmailPassword(email: string, password: string): Promise<void>;
  signInGithub(): Promise<void>; signOut(): Promise<void>;
  setComplete(shrineId: string, completed: boolean): Promise<void>; retry(): Promise<void>;
  resolveConflict(shrineId: string, choice: 'local' | 'cloud'): Promise<void>;
  previewTransfer(source: TransferSource): Promise<TransferPreview>;
  applyTransfer(previewId: string, mode: 'merge' | 'replace'): Promise<void>;
  dismissTransfer(previewId: string): void; previewRestore(backupId: string): Promise<TransferPreview>;
}
