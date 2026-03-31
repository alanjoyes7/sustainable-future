export type LocalScanRecord = {
  id: string;
  uid: string;
  item: string;
  category: string;
  guidance: string;
  inputMethod: 'image' | 'text' | 'camera';
  timestamp: string;
  offlineMode?: boolean;
  rewardBadge?: string | null;
};

export type DemoUserRecord = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  metadata: {
    creationTime: string;
  };
};

const SCANS_STORAGE_KEY = 'biome.localScans';
const DEMO_USER_STORAGE_KEY = 'biome.demoUser';

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function createDemoUser(email = 'demo@thebiome.app', displayName = 'Demo Explorer'): DemoUserRecord {
  return {
    uid: 'demo-user',
    email,
    displayName,
    photoURL: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
    metadata: {
      creationTime: new Date().toISOString(),
    },
  };
}

export function getStoredDemoUser(): DemoUserRecord | null {
  if (typeof window === 'undefined') return null;
  return parseJson<DemoUserRecord | null>(window.localStorage.getItem(DEMO_USER_STORAGE_KEY), null);
}

export function setStoredDemoUser(user: DemoUserRecord) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(user));
}

export function clearStoredDemoUser() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
}

export function getLocalScans(uid?: string): LocalScanRecord[] {
  if (typeof window === 'undefined') return [];

  const scans = parseJson<LocalScanRecord[]>(window.localStorage.getItem(SCANS_STORAGE_KEY), []);
  const filtered = uid ? scans.filter((scan) => scan.uid === uid) : scans;
  return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function saveLocalScan(scan: Omit<LocalScanRecord, 'id'> & { id?: string }) {
  if (typeof window === 'undefined') return;

  const scans = getLocalScans();
  const id = scan.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`);
  const next = [{ ...scan, id }, ...scans.filter((item) => item.id !== id)];
  window.localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(next));
}

export function deleteLocalScan(scanId: string) {
  if (typeof window === 'undefined') return;

  const scans = getLocalScans();
  const next = scans.filter((scan) => scan.id !== scanId);
  window.localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(next));
}
