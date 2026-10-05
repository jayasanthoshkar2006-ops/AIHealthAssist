const DB_NAME = 'healthassist-local-data';
const DB_VERSION = 1;
const STORE_NAME = 'records';

type LocalRecord = {
  key: string;
  account: string;
  endpoint: string;
  method: string;
  value: unknown;
  updatedAt: string;
};

function getAccountKey(): string {
  return localStorage.getItem('userEmail') || 'anonymous';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Unable to open local data storage.'));
  });
}

function makeKey(endpoint: string, method: string): string {
  return getAccountKey() + '::' + method.toUpperCase() + '::' + endpoint;
}

export async function saveLocalRecord(endpoint: string, method: string, value: unknown): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put({
        key: makeKey(endpoint, method),
        account: getAccountKey(),
        endpoint,
        method: method.toUpperCase(),
        value,
        updatedAt: new Date().toISOString(),
      } satisfies LocalRecord);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn('Local data save skipped:', error);
  }
}

export async function readLocalRecord<T>(endpoint: string, method = 'GET'): Promise<T | null> {
  try {
    const db = await openDb();
    const record = await new Promise<LocalRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const request = tx.objectStore(STORE_NAME).get(makeKey(endpoint, method));
      request.onsuccess = () => resolve(request.result as LocalRecord | undefined);
      request.onerror = () => reject(request.error);
    });
    db.close();
    return record ? (record.value as T) : null;
  } catch (error) {
    console.warn('Local data read skipped:', error);
    return null;
  }
}

export async function clearLocalAccountData(): Promise<void> {
  try {
    const account = getAccountKey();
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor();
      request.onsuccess = () => {
        const cursor = request.result as IDBCursorWithValue | null;
        if (!cursor) return;
        if ((cursor.value as LocalRecord).account === account) cursor.delete();
        cursor.continue();
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) {
    console.warn('Local account data clear skipped:', error);
  }
}

export async function exportLocalData(): Promise<{ exportedAt: string; account: string; records: LocalRecord[] }> {
  const account = getAccountKey();
  const db = await openDb();
  const records = await new Promise<LocalRecord[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).openCursor();
    const output: LocalRecord[] = [];
    request.onsuccess = () => {
      const cursor = request.result as IDBCursorWithValue | null;
      if (!cursor) {
        resolve(output);
        return;
      }
      const record = cursor.value as LocalRecord;
      if (record.account === account) output.push(record);
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return { exportedAt: new Date().toISOString(), account, records };
}

export async function importLocalData(payload: { records?: LocalRecord[] }): Promise<number> {
  const account = getAccountKey();
  const records = Array.isArray(payload?.records) ? payload.records : [];
  const db = await openDb();
  let imported = 0;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const record of records) {
      if (!record || typeof record.endpoint !== 'string' || typeof record.method !== 'string') continue;
      store.put({ ...record, key: makeKey(record.endpoint, record.method), account, updatedAt: record.updatedAt || new Date().toISOString() });
      imported += 1;
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return imported;
}

export async function getLocalStorageEstimate(): Promise<{ usage?: number; quota?: number }> {
  try {
    if (navigator.storage?.estimate) return await navigator.storage.estimate();
  } catch (error) {
    console.warn('Storage estimate unavailable:', error);
  }
  return {};
}
