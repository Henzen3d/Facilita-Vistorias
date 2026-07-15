# Phase 2: App de Campo (PWA) -- Nucleo Offline - Research

**Researched:** 2026-07-14
**Domain:** PWA / Offline-First / Mobile Web APIs (Camera, Audio, IndexedDB, Service Workers)
**Confidence:** HIGH

## Summary

Phase 2 transforms 10 placeholder screens in `/field` into a functional offline-first PWA for field inspectors. The core technical challenge is enabling a complete inspection workflow (navigate rooms, capture photos/audio per item, complete a safety checklist) with zero network connectivity, then syncing everything when back online.

The stack is already installed: `next-pwa` v5.6.0 (not yet configured) for service worker generation and PWA manifest, and `idb` v8.0.3 for IndexedDB. The primary browser target is Chrome for Android (the standard field inspector phone in Brazil), with Safari iOS as a secondary target requiring explicit fallback handling for MediaRecorder and Background Sync.

**Primary recommendation:** Use `<input capture>` (not getUserMedia) for camera, MediaRecorder with `audio/webm` for audio (with `audio/mp4` fallback for Safari), polling-based sync with `navigator.onLine` events (not Background Sync API, which is Chrome-only), and an IndexedDB schema that mirrors the Prisma models but with local-only status fields and queued mutations.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| PWA manifest & service worker | Browser / Client | -- | SW is a client-side asset; next-pwa injects it at build time |
| Offline data storage (IndexedDB) | Browser / Client | -- | Entirely client-side; no server dependency during inspection |
| Photo capture & local preview | Browser / Client | -- | Uses device camera via `<input capture>` or MediaDevices API |
| Audio recording & local preview | Browser / Client | -- | MediaRecorder API runs entirely in browser |
| Pre-loading daily inspections | Browser / Client | API / Backend | Client fetches from API on first load; caches in IndexedDB |
| Sync queue & background upload | Browser / Client | API / Backend | Client queues mutations locally; pushes to API when online |
| Auth session (7-day PWA) | Browser / Client | API / Backend | NextAuth JWT stored in cookie; middleware validates on API calls |
| Checklist data (Protocolo de Chegada) | Browser / Client | API / Backend | Stored locally first; synced to server on reconnect |
| Conflict resolution | API / Backend | -- | Server is source of truth; client overwrites on sync (last-write-wins for field data) |

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** App name on home screen: "Facilita Vistorias"
- **D-02:** Icon: blue with Facilita brand logo
- **D-03:** Theme color: `#00AEEF` (primary from Design System)
- **D-04:** Splash screen: simple and clean design, aligned to visual identity
- **D-05:** Pre-load ALL of the day's inspections (complete data) assigned to the logged-in inspector
- **D-06:** Local storage via IndexedDB (`idb` -- already installed). No network dependency during inspection
- **D-07:** Photos: native camera + device gallery. Multiple photos per item. Preview with delete/retake option before confirming
- **D-08:** Audio: WhatsApp-style button -- tap to start recording, tap to stop. Show second counter during recording. Offer audio preview before confirming, with option to delete/re-record
- **D-09:** Automatic background sync as soon as device regains stable connection. No manual intervention required
- **D-10:** Cloud icon as visual status indicator per item: Orange/Slate = pending (saved only in local IndexedDB), Green/Blue = synced with server

### Claude's Discretion
- Retry strategy and sync failure handling (exponential backoff, retry queue)
- Exact IndexedDB store structure (local table schema)
- Choice between `<input capture>` vs MediaDevices API for camera
- Specific service worker implementation and caching strategy
- Conflict handling (e.g., item edited on server while offline)
- IndexedDB cleanup policy after successful sync (keep cache vs free space)
- PWA update approach (update prompt vs auto-update)

### Deferred Ideas (OUT OF SCOPE)
- Automatic entry vs exit comparison -- Phase 5 (Contestacao)
- Digital signature in field app -- Backlog
- Timeline with inspector geolocation -- Backlog
- AI review mode in field app (edit suggested description) -- Phase 3 (Pipeline de IA)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-pwa | 5.6.0 | Service worker generation, PWA manifest, Workbox integration | Already installed; zero-config with `withPWA()`; Workbox v6 under the hood [VERIFIED: node_modules/next-pwa/package.json] |
| idb | 8.0.3 | Promise-based IndexedDB wrapper with TypeScript support | Already installed; `DBSchema` interface for full typing; from Jake Archibald (Google) [VERIFIED: node_modules/idb/package.json, idb/README.md] |
| workbox-window | 6.5.4 | Service worker lifecycle management (register, update, message) | Bundled with next-pwa v5.6.0; handles update prompts and SW registration [VERIFIED: node_modules/next-pwa/package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | 3.23.8 | Runtime validation of local data before sync | Already installed; validate IndexedDB data matches server expectations before uploading |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| next-pwa | @serwist/next (Serwist) | Serwist is newer and maintained, but next-pwa v5.6.0 already works; not worth a migration for this project |
| idb | Dexie.js | Dexie has richer query API but adds 20KB+; idb is 1.19KB and maps directly to IndexedDB API; D-06 already locked idb |

**Installation:**
```bash
# All packages already installed -- no new npm install needed
# Verify:
npm ls next-pwa idb zod
```

**Version verification:** `npm view idb version` returns 8.0.3 (July 2026). Package.json specifies `^8.0.0`, so 8.0.3 resolves. `next-pwa` latest is 5.6.0 (same as installed). [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```
                              INITIAL LOAD (online)
  ┌──────────────┐     GET /api/vistorias?data=hoje     ┌──────────────┐
  │   Field App  │ ──────────────────────────────────>  │  Next.js API │
  │   (PWA)      │ <──────────────────────────────────  │  (server)    │
  │              │     Vistorias + Ambientes + Itens     │              │
  └──────┬───────┘                                      └──────────────┘
         │
         │ write to IndexedDB
         ▼
  ┌──────────────────────────────────────────────┐
  │              IndexedDB (idb)                  │
  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
  │  │vistorias │ │ midia_queue│ │checklist     │  │
  │  │(preload) │ │(pending) │ │(pending)     │  │
  │  └──────────┘ └──────────┘ └──────────────┘  │
  └──────────────────────────────────────────────┘
         │                       ▲
         │ OFFLINE WORKFLOW      │ sync when online
         ▼                       │
  ┌──────────────┐     ┌──────────────────────┐
  │ Photo Capture│     │   Sync Engine        │
  │ <input capt> │     │  ┌────────────────┐  │
  │ Audio Record │────>│  │ online detector │  │
  │ Checklist    │     │  │ retry queue     │  │
  └──────────────┘     │  │ upload manager  │  │
                       │  └────────────────┘  │
                       └──────────┬───────────┘
                                  │ POST /api/vistorias/[id]/itens/.../midia
                                  │ POST /api/vistorias/[id]/checklist
                                  ▼
                           ┌──────────────┐
                           │  Next.js API │
                           │  PostgreSQL  │
                           └──────────────┘
```

**Entry points:**
1. Inspector opens PWA with internet -> pre-loads today's inspections into IndexedDB
2. inspector opens PWA offline -> reads from IndexedDB directly
3. During inspection: all captures (photos, audio, checklist) write to IndexedDB with `syncStatus: 'PENDENTE'`
4. When connectivity returns: sync engine drains the pending queue to the API

**Decision points:**
- If `navigator.onLine === false`: all writes go to IndexedDB only, UI shows cloud-orange icon
- If `navigator.onLine === true`: sync engine processes queue; successful items get cloud-green icon
- If sync fails (HTTP error): item stays in queue, retry with exponential backoff (Claude's discretion)

### Recommended Project Structure
```
src/
├── app/field/                    # Existing: 10 page routes (App Router)
│   ├── page.tsx                  # Dashboard (hybrid: server preload + client)
│   ├── vistorias/[id]/           # Inspection detail & workflow
│   │   ├── page.tsx              # Info + "Start Protocol" trigger
│   │   ├── ambientes/            # Room list + checklist
│   │   │   ├── page.tsx
│   │   │   └── [ambienteId]/     # Items within a room
│   │   │       ├── page.tsx
│   │   │       └── itens/[itemId]/
│   │   │           ├── page.tsx  # Capture (camera + audio)
│   │   │           └── revisao/page.tsx
│   │   ├── resumo/page.tsx       # Summary before finalize
│   │   └── sucesso/page.tsx      # Success + share
│   ├── sync/page.tsx             # Sync queue status
│   └── login/page.tsx            # Field login
├── lib/
│   ├── db/
│   │   ├── index.ts              # Existing: Prisma singleton
│   │   ├── prisma.ts             # Existing: re-export
│   │   └── idb.ts                # NEW: IndexedDB setup + helper functions
│   └── sync/
│       ├── engine.ts             # NEW: Sync queue processor
│       ├── online-detector.ts    # NEW: navigator.onLine + custom events
│       └── types.ts              # NEW: Shared types for sync
├── hooks/
│   ├── useCamera.ts              # NEW: Camera capture hook
│   ├── useAudioRecorder.ts       # NEW: Audio recording hook
│   ├── useOnlineStatus.ts        # NEW: Online/offline detection hook
│   └── useSyncStatus.ts          # NEW: Per-item sync status hook
└── components/field/
    ├── CloudSyncIcon.tsx          # NEW: D-10 status indicator
    ├── PhotoGrid.tsx              # NEW: Multi-photo preview grid
    ├── AudioRecorderButton.tsx    # NEW: WhatsApp-style record button
    ├── ChecklistForm.tsx          # NEW: Protocolo de Chegada form
    └── SyncBanner.tsx             # NEW: Offline/online/ syncing banner
```

### Pattern 1: Offline-First Write Pattern
**What:** All user data writes to IndexedDB first, then to server via sync queue. The UI never blocks on network.
**When to use:** Every mutation in the field app (photos, audio, checklist, item status)
**Example:**
```typescript
// Source: idb v8 README (node_modules/idb/README.md)
// Pattern: Write local first, enqueue for sync

import { openDB, DBSchema } from 'idb';

interface FieldDB extends DBSchema {
  midia_queue: {
    key: string;           // local UUID
    value: {
      id: string;
      itemId: string;
      tipo: 'FOTO' | 'AUDIO';
      blob: Blob;          // raw media stored locally
      syncStatus: 'PENDENTE' | 'UPLOADING' | 'SYNCED' | 'ERROR';
      retryCount: number;
      createdAt: number;   // Date.now()
    };
    indexes: { 'by-sync-status': string; 'by-item': string };
  };
}

// Initialize DB
const db = await openDB<FieldDB>('facilita-field', 1, {
  upgrade(db) {
    const store = db.createObjectStore('midia_queue', { keyPath: 'id' });
    store.createIndex('by-sync-status', 'syncStatus');
    store.createIndex('by-item', 'itemId');
  },
});

// Write pattern: always write to IndexedDB first
async function saveMedia(itemId: string, blob: Blob, tipo: 'FOTO' | 'AUDIO') {
  const id = crypto.randomUUID();
  await db.put('midia_queue', {
    id,
    itemId,
    tipo,
    blob,
    syncStatus: 'PENDENTE',
    retryCount: 0,
    createdAt: Date.now(),
  });
  // Sync engine picks this up when online -- no await
  triggerSyncIfOnline();
}
```

### Pattern 2: Pre-Load Data on Initial Visit
**What:** Fetch complete inspection data from API when online, populate IndexedDB stores, then work entirely from local data.
**When to use:** When inspector opens a specific inspection for the first time (from dashboard)
**Example:**
```typescript
// Source: SYSTEM_DESIGN.md section 6 + idb documentation
// Pattern: API response -> IndexedDB stores, then local-first reads

interface VistoriaLocal {
  id: string;
  codigo: string;
  tipo: string;
  data: string;
  status: string;
  imovel: { endereco: string; numero: string; complemento: string; bairro: string; cidade: string; };
  ambientes: AmbienteLocal[];
  checklist?: ChecklistLocal;
}

async function preloadVistoria(vistoriaId: string) {
  // Step 1: Fetch from API (online only)
  const res = await fetch(`/api/vistorias/${vistoriaId}`);
  if (!res.ok) throw new Error('Failed to fetch inspection data');
  const data: VistoriaLocal = await res.json();

  // Step 2: Write to IndexedDB in a single transaction
  const tx = db.transaction(['vistorias', 'ambientes', 'items', 'checklist'], 'readwrite');

  await tx.objectStore('vistorias').put({...data, _cachedAt: Date.now()});

  for (const amb of data.ambientes) {
    await tx.objectStore('ambientes').put(amb);
    for (const item of amb.items) {
      await tx.objectStore('items').put(item);
    }
  }

  if (data.checklist) {
    await tx.objectStore('checklist').put(data.checklist);
  }

  await tx.done;
}

// Step 3: All subsequent reads are local
async function getVistoriaLocal(id: string) {
  const vistoria = await db.get('vistorias', id);
  const ambientes = await db.getAllFromIndex('ambientes', 'by-vistoria', id);
  // ... assemble full object from stores
  return { ...vistoria, ambientes };
}
```

### Pattern 3: React Hooks for Media APIs
**What:** Custom hooks encapsulate browser media APIs (camera, audio) with consistent state management and cleanup.
**When to use:** Every media interaction -- hooks manage lifecycle, permissions, and memory
**Example:**
```typescript
// Pattern: Hook-based media capture
// Camera hook
function useCamera() {
  const [photos, setPhotos] = useState<{ id: string; blob: Blob; previewUrl: string }[]>([]);

  // Recommended approach: <input capture> for reliability
  // Returns a trigger function and the input ref
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerCapture = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const id = crypto.randomUUID();
    const previewUrl = URL.createObjectURL(file);
    setPhotos(prev => [...prev, { id, blob: file, previewUrl }]);
  }, []);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter(p => p.id !== id);
    });
  }, []);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => photos.forEach(p => URL.revokeObjectURL(p.previewUrl));
  }, []);

  return { photos, inputRef, triggerCapture, handleFileChange, removePhoto };
}
```

### Anti-Patterns to Avoid
- **Server Components for field pages:** The field app pages must be Client Components (`'use client'`) because they access IndexedDB, camera, microphone, and `navigator.onLine`. Do NOT try to preload data server-side in field pages -- the whole point is offline operation.
- **Storing blobs in IndexedDB without size limits:** Photos can be 5-15MB each; implement a max storage budget (~500MB) and warn before exceeding. [ASSUMED]
- **Using `await` between transaction operations with external calls:** IndexedDB transactions auto-close at the microtask boundary. Never `await fetch()` or any non-IDB operation inside a transaction.
- **Relying on Background Sync API for iOS:** Safari/iOS does not support the Background Sync API. Must use `navigator.onLine` polling as the primary sync trigger.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB wrapper | Manual IDBOpenDBRequest with onsuccess/onerror | `idb` v8 (already installed) | idb provides Promise-based API, TypeScript types via DBSchema, transaction safety, and cursor iteration [VERIFIED: node_modules/idb/README.md] |
| Service worker generation | Manual sw.js with workbox-build | `next-pwa` v5.6.0 (already installed) | Handles webpack integration, precaching, runtime caching, and workbox-window lifecycle [VERIFIED: node_modules/next-pwa/README.md] |
| Camera capture UI | Custom getUserMedia with constraints negotiation | `<input type="file" capture="environment" accept="image/*">` | Native OS camera app handles focus, flash, resolution; no permission negotiation code; works on all mobile browsers including iOS Safari [CITED: caniuse.com input-capture] |
| Online/offline detection | setInterval polling | `navigator.onLine` + `online`/`offline` events | Browser-native events are more efficient; supplement with periodic health checks to detect captive portals |
| Exponential backoff for retry | Manual setTimeout with multiplier | Simple async function with delay | Not complex enough to warrant a library; implement as `retryWithBackoff(fn, { maxRetries: 5, baseDelay: 1000 })` [ASSUMED] |
| Media blob URL management | Manual URL tracking | `URL.createObjectURL()` + `URL.revokeObjectURL()` | Browser-native API; the key is the cleanup pattern, not a library |

**Key insight:** The PWA offline-first domain has well-established browser APIs (IndexedDB, MediaRecorder, Service Worker, Cache API). The value of libraries like `idb` and `next-pwa` is in reducing boilerplate and preventing subtle bugs (transaction auto-close, service worker lifecycle, TypeScript types). Do NOT add Dexie.js, localForage, or other IndexedDB wrappers -- idb v8 is sufficient and already locked by D-06.

## Runtime State Inventory

> **SKIPPED** -- This is a greenfield PWA feature build, not a rename/refactor/migration phase. No stored data, live service config, OS-registered state, secrets, or build artifacts reference old names.

## Common Pitfalls

### Pitfall 1: IndexedDB Transaction Auto-Close
**What goes wrong:** Transaction closes silently when control returns to the event loop. If you `await` a non-IDB operation (like `fetch()`) inside a transaction, subsequent IDB operations throw `TransactionInactiveError`.
**Why it happens:** IndexedDB transactions are auto-committed when no requests are pending and the microtask queue is empty. The `await` yields control, the microtask queue drains, and the transaction closes.
**How to avoid:** Do all `await` calls BEFORE opening the transaction, or batch all IDB operations within a single synchronous block after all external data is ready. Never `await fetch()` between IDB operations in the same transaction.
**Warning signs:** `TransactionInactiveError` or `InvalidStateError` in console; data partially written to some stores but not others.

### Pitfall 2: MediaRecorder Codec Compatibility
**What goes wrong:** `new MediaRecorder(stream)` with no `mimeType` specified may produce an unplayable file on some browsers, or fail to record entirely.
**Why it happens:** Chrome Android prefers `audio/webm;codecs=opus`, Safari iOS prefers `audio/mp4`, and Firefox may use `audio/ogg`. Without explicit mimeType negotiation, the default codec may be unplayable on the target device.
**How to avoid:** Check `MediaRecorder.isTypeSupported()` for preferred codecs in order (`audio/webm;codecs=opus`, `audio/webm`, `audio/mp4`, `audio/mp4;codecs=mp4a.40.2`), and use the first supported one. For Safari (no MediaRecorder), provide a clear message that audio recording requires Chrome or the native Facilita app.
**Warning signs:** Recorded audio plays on Android but not on iOS, or vice versa; `MediaRecorder` constructor throws `NotSupportedError`.

### Pitfall 3: Service Worker Scope and App Router Routes
**What goes wrong:** Service worker registered at `/` caches API responses unintentionally, or SW scope doesn't match the `/field` path structure.
**Why it happens:** next-pwa registers the SW at root `/` by default. The default `runtimeCaching` caches `/api/` routes with `NetworkFirst`. For the field PWA, we WANT API data cached for offline use -- but only the GET endpoints for preloading, not POST/PUT mutations.
**How to avoid:** Customize `runtimeCaching` to use `NetworkOnly` for mutation endpoints (`POST`, `PUT`, `DELETE`), while keeping `NetworkFirst` for GET endpoints. Set `scope: '/'` to ensure SW covers all `/field` routes.
**Warning signs:** Stale data shown after sync; mutations not reaching server because SW served cached response.

### Pitfall 4: React Server Components in Field Pages
**What goes wrong:** Trying to use `async function Component()` (RSC) for field pages that need IndexedDB or camera access.
**Why it happens:** Next.js 15 App Router defaults to Server Components. Browser APIs (IndexedDB, `navigator`, `MediaRecorder`) are only available in Client Components.
**How to avoid:** Add `'use client'` directive to ALL field app pages. Server Components are only appropriate for the root layout (metadata, font loading). The field login page might remain a Server Component since it's just a form that submits to NextAuth.
**Warning signs:** `ReferenceError: indexedDB is not defined` or `navigator is not defined` during `next build` or at runtime.

### Pitfall 5: iOS Safari PWA Limitations
**What goes wrong:** Features that work on Chrome Android PWA fail silently on iOS Safari (added to Home Screen).
**Why it happens:** iOS Safari does not support: Background Sync API, MediaRecorder API (limited support), `beforeinstallprompt` event, persistent storage, some manifest features (`display: standalone` works but status bar customization is limited).
**How to avoid:** Test on real iOS devices early. Provide clear feature-degradation messages for unsupported features (e.g., "Audio recording requires Chrome -- please use voice notes instead"). For camera, `<input capture>` works on iOS Safari so photos are fine. For sync, polling with `navigator.onLine` works everywhere.
**Warning signs:** iOS users reporting "record button does nothing" or "sync never happens."

### Pitfall 6: Blob Storage Memory Pressure
**What goes wrong:** Multiple high-resolution photos stored as Blobs in IndexedDB consume hundreds of MB, causing the PWA to crash or the browser to evict IndexedDB data.
**Why it happens:** IndexedDB has no hard size limit, but browsers typically allow 10-60% of disk space. Photos at native resolution can be 8-15MB each. A full inspection might have 50+ photos = 400-750MB.
**How to avoid:** Resize photos to max 1920px longest edge before storing (using Canvas API). Implement a storage quota check using `navigator.storage.estimate()`. Show warning when approaching 80% of quota. Target: max 2MB per photo after resize.
**Warning signs:** `QuotaExceededError`; app crashes on older devices; IndexedDB data being evicted without warning.

## Code Examples

### Camera Capture (Recommended: `<input capture>`)
```tsx
// Source: MDN <input capture> specification + mobile testing patterns [CITED: developer.mozilla.org/en-US/docs/Web/HTML/Attributes/capture]
// Why <input capture> over getUserMedia: No permission popup, uses OS camera app (focus, flash, HDR),
// works on Safari iOS, user gets gallery option automatically, simpler code.

'use client';

function CameraCapture({ onPhoto }: { onPhoto: (blob: Blob) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"  // rear camera; "user" for selfie
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPhoto(file);
          // Reset so same file can be re-selected
          e.target.value = '';
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="h-16 w-16 bg-[#00AEEF] text-white rounded-full flex items-center justify-center shadow-lg"
      >
        📸
      </button>
    </>
  );
}
```

### Audio Recorder (WhatsApp-Style)
```tsx
// Source: MediaRecorder API MDN [CITED: developer.mozilla.org/en-US/docs/Web/API/MediaRecorder]
// Chrome Android supports audio/webm;codecs=opus natively.
// Safari fallback: detect and show message.

'use client';

const getSupportedMimeType = () => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
  ];
  return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
};

function AudioRecorder({ onAudio }: { onAudio: (blob: Blob, duration: number) => void }) {
  const [state, setState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTime = useRef<number>(0);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = getSupportedMimeType();

    if (!mimeType) {
      alert('Audio recording is not supported on this browser.');
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    chunks.current = [];
    startTime.current = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: mimeType });
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      setState('preview');
      onAudio(blob, duration);
      // Stop all tracks
      stream.getTracks().forEach(t => t.stop());
    };

    recorder.start();
    mediaRecorder.current = recorder;
    setState('recording');

    // Start timer
    let count = 0;
    timerRef.current = setInterval(() => {
      count++;
      setSeconds(count);
    }, 1000);
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const discard = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setSeconds(0);
    setState('idle');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {state === 'idle' && (
        <button onClick={startRecording}
          className="h-16 w-16 bg-red-500 text-white rounded-full flex items-center justify-center">
          🎤
        </button>
      )}
      {state === 'recording' && (
        <div className="flex items-center gap-3">
          <span className="text-red-500 animate-pulse font-mono">{seconds}s</span>
          <button onClick={stopRecording}
            className="h-16 w-16 bg-red-600 text-white rounded-full flex items-center justify-center animate-pulse">
            ⏹
          </button>
        </div>
      )}
      {state === 'preview' && audioUrl && (
        <div className="flex items-center gap-3">
          <audio src={audioUrl} controls className="h-10" />
          <button onClick={discard} className="text-red-500 text-sm">Delete</button>
          <button onClick={() => setState('idle')} className="text-[#00AEEF] text-sm">Keep</button>
        </div>
      )}
    </div>
  );
}
```

### Sync Engine with Exponential Backoff
```typescript
// Pattern: Poll-based sync with exponential backoff (Claude's discretion)
// Background Sync API is Chrome-only -> polling with navigator.onLine as primary strategy

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { maxRetries = 5, baseDelay = 1000 }: { maxRetries?: number; baseDelay?: number } = {}
): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // jitter
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

async function syncPendingItems(db: IDBPDatabase<FieldDB>) {
  const pending = await db.getAllFromIndex('midia_queue', 'by-sync-status', 'PENDENTE');
  if (pending.length === 0) return;

  for (const item of pending) {
    try {
      // Mark as uploading
      await db.put('midia_queue', { ...item, syncStatus: 'UPLOADING' });

      const formData = new FormData();
      formData.append('file', item.blob, `${item.id}.${item.tipo === 'FOTO' ? 'jpg' : 'webm'}`);
      formData.append('itemId', item.itemId);
      formData.append('tipo', item.tipo);

      await retryWithBackoff(() =>
        fetch(`/api/vistorias/items/${item.itemId}/midia`, {
          method: 'POST',
          body: formData,
        })
      );

      // Mark as synced
      await db.put('midia_queue', { ...item, syncStatus: 'SYNCED' });

      // Cleanup policy (Claude's discretion): remove blob after sync to free space
      // Keep the metadata entry for 7 days, then delete
    } catch (err) {
      await db.put('midia_queue', {
        ...item,
        syncStatus: 'ERROR',
        retryCount: item.retryCount + 1,
      });
    }
  }
}
```

### Online Status Hook
```typescript
// Pattern: Browser online/offline events + periodic health check
// navigator.onLine can be false-positive (captive portal); supplement with HEAD request

function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Periodic health check (every 30s) to detect captive portals
    const interval = setInterval(async () => {
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
          setIsOnline(res.ok);
        } catch {
          setIsOnline(false);
        }
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      clearInterval(interval);
    };
  }, []);

  return isOnline;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `getUserMedia` for camera preview | `<input capture>` for reliability | Industry shift for PWAs where inline preview isn't critical | Fewer permissions issues, works on iOS Safari, simpler code path |
| Background Sync API | `navigator.onLine` + polling | Background Sync never shipped on Safari/Firefox | Universal browser support; slightly less battery-efficient but actually works |
| Dexie.js for IndexedDB | `idb` v8 (thin wrapper) | Community trend toward smaller, typed wrappers | 20KB less bundle; DBSchema typing is sufficient for our use case |
| `workbox-webpack-plugin` directly | `next-pwa` wrapper | Next.js ecosystem consolidation | Zero-config for Next.js; same Workbox v6 underneath |

**Deprecated/outdated:**
- **AppCache:** Removed from browsers. Use Service Worker + Cache API instead (provided by next-pwa).
- **`create-react-app` PWA template:** Not applicable; we use Next.js. next-pwa is the equivalent for this ecosystem.
- **`navigator.getUserMedia` (callback-based):** Replaced by `navigator.mediaDevices.getUserMedia()` (Promise-based). Not used for capture anyway.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Next.js 15 with next-pwa v5.6.0 works without requiring custom webpack configuration overrides | next-pwa integration | Build failures; may need webpack config adjustments for Turbopack (Next.js 15 default) |
| A2 | Photos can be resized to max 1920px using Canvas API before IndexedDB storage, keeping individual photos under 2MB | Common Pitfalls | Photos too large -> IndexedDB quota exceeded -> data loss in field |
| A3 | Safari iOS users are acceptable with "audio not supported" message; recording is not critical path for iOS | MediaRecorder | If iOS is primary device target, need alternative audio approach (e.g., voice note via OS recording) |
| A4 | `navigator.storage.estimate()` is available on target Chrome Android devices (Chrome 55+) | Environment | Older Android devices (< Chrome 55) can't check quota; silent failures |
| A5 | Exponential backoff with 5 retries (max 31s total delay) is sufficient for field sync scenarios | Sync Engine | Transient network issues lasting >31s cause items to stay in ERROR state requiring manual retry |
| A6 | The existing server-side NextAuth session (JWT in cookie) works for API calls from the PWA's sync engine | Auth | If cookie-based auth fails in service worker context, need token-based auth for sync uploads |

## Open Questions

1. **Next.js 15 + next-pwa + Turbopack compatibility**
   - What we know: next-pwa 5.6.0 uses webpack plugin (workbox-webpack-plugin). Next.js 15 uses Turbopack by default in dev mode. The AGENTS.md explicitly warns that this Next.js version has breaking changes.
   - What's unclear: Whether next-pwa works with `next dev --turbo` or if we need to disable Turbopack. In production builds (`next build`), webpack is still used so the concern is development workflow only.
   - Recommendation: Disable Turbopack in development for PWA testing (`next dev --no-turbo`). Production builds use webpack and are confirmed working by next-pwa docs. Add this to the plan as an explicit configuration note.

2. **MediaRecorder on Safari iOS (WebKit)**
   - What we know: As of iOS 14.5+, Safari has experimental MediaRecorder support. It may not be available on all iOS versions. Chrome on iOS uses WebKit (Apple requirement) so it also lacks MediaRecorder.
   - What's unclear: The exact iOS version cutoff where MediaRecorder becomes available, and whether `audio/mp4` encoding works on iOS Safari.
   - Recommendation: Implement audio recording with feature detection. When MediaRecorder is unavailable, show a message: "Gravacao de audio requer Google Chrome no Android. Use notas de texto como alternativa." This is acceptable for MVP (Phase 2) since field inspectors primarily use Android in Brazil. [ASSUMED]

3. **Service Worker scope and auth cookies**
   - What we know: NextAuth stores JWT in a session cookie. Service workers can include credentials in fetch requests. The `/field` pages are protected by middleware that checks the JWT.
   - What's unclear: Whether the sync engine's `fetch()` calls from the main thread (not SW) automatically include the NextAuth session cookie, or if we need explicit `credentials: 'include'`.
   - Recommendation: Always use `credentials: 'include'` in sync fetch calls. Test with real NextAuth session after Phase 2 implementation.

4. **IndexedDB storage quota on common Android devices**
   - What we know: Chrome on Android typically allows ~20-60% of available disk space for IndexedDB. A 32GB device with 20GB free allows ~4-12GB. This is more than enough for a single day of inspections.
   - What's unclear: Whether low-end devices (8-16GB storage) with limited free space could cause quota issues.
   - Recommendation: Implement quota check using `navigator.storage.estimate()` and warn at 80%. Include a "clear completed inspections" button in the sync screen.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build toolchain | Yes | v24.18.0 | -- |
| npm | Package manager | Yes | 11.6.2 | -- |
| next-pwa | Service worker generation | Yes (installed) | 5.6.0 | -- |
| idb | IndexedDB wrapper | Yes (installed) | 8.0.3 | -- |
| Chrome/Android device | Primary PWA target | Unknown (no device connected) | N/A | Manual testing on Task 9 |
| iOS/Safari device | Secondary PWA target | Unknown (no device connected) | N/A | Manual testing on Task 9 |

**Missing dependencies with no fallback:**
- Real mobile device for testing (Task 9) -- must be provided by the user; not blocking development but critical for verification

**Missing dependencies with fallback:**
- None. All development dependencies are available.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (specified in package.json: `"test": "vitest run"`) |
| Config file | none -- vitest.config.* not found (needs Wave 0 creation) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| offline-storage | Pre-loaded inspections stored in IndexedDB and readable offline | unit | `npx vitest run src/lib/db/__tests__/idb.test.ts -t "preload"` | No -- Wave 0 |
| offline-storage | IndexedDB schema matches Prisma model structure | unit | `npx vitest run src/lib/db/__tests__/idb.test.ts -t "schema"` | No -- Wave 0 |
| camera-capture | `<input capture>` triggers native camera and returns Blob | integration | `npx vitest run src/hooks/__tests__/useCamera.test.ts` | No -- Wave 0 |
| audio-record | MediaRecorder produces playable audio Blob with duration | integration | `npx vitest run src/hooks/__tests__/useAudioRecorder.test.ts` | No -- Wave 0 |
| sync-engine | Pending items synced to API on reconnect | integration | `npx vitest run src/lib/sync/__tests__/engine.test.ts` | No -- Wave 0 |
| sync-status | Cloud icon shows correct color per sync state | unit | `npx vitest run src/components/field/__tests__/CloudSyncIcon.test.tsx` | No -- Wave 0 |
| offline-ui | PWA loads from cache when offline | e2e | Manual only -- requires device with airplane mode | Manual only |
| checklist | Protocolo de Chegada fields saved to IndexedDB | unit | `npx vitest run src/components/field/__tests__/ChecklistForm.test.tsx` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose` (unit/integration tests)
- **Per wave merge:** `npx vitest run` (full suite)
- **Phase gate:** Full suite green + manual device test (Task 9) before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` -- Vitest configuration for Next.js + React (jsdom environment, path aliases)
- [ ] `src/lib/db/__tests__/idb.test.ts` -- IndexedDB schema and CRUD tests (requires fake-indexeddb or happy-dom)
- [ ] `src/hooks/__tests__/useCamera.test.ts` -- Camera hook tests with mocked input element
- [ ] `src/hooks/__tests__/useAudioRecorder.test.ts` -- Audio recorder hook tests with mocked MediaRecorder
- [ ] `src/lib/sync/__tests__/engine.test.ts` -- Sync engine tests with mocked fetch
- [ ] `src/components/field/__tests__/CloudSyncIcon.test.tsx` -- Component rendering tests
- [ ] `src/components/field/__tests__/ChecklistForm.test.tsx` -- Form validation tests
- [ ] Framework install: `npm install -D @testing-library/react @testing-library/jest-dom jsdom fake-indexeddb vitest` -- if not already in devDependencies

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | Yes | NextAuth JWT session (Phase 1) -- PWA uses same auth; sync engine must include credentials |
| V3 Session Management | Yes | 7-day session for PWA (SYSTEM_DESIGN.md section 8); JWT stored in httpOnly cookie |
| V4 Access Control | Yes | Middleware already restricts `/field/*` to VISTORIADOR role (Phase 1) |
| V5 Input Validation | Yes | Zod validation of local data before sync upload; server validates on receipt |
| V6 Cryptography | No | No custom crypto in Phase 2; TLS handles transport security |

### Known Threat Patterns for PWA + Offline-First

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Stale auth token in IndexedDB used after session expiry | Elevation of Privilege | Check token validity before sync; redirect to login on 401 |
| Man-in-the-middle intercepts sync upload | Information Disclosure | HTTPS required (service worker only registers on HTTPS or localhost) |
| Malicious blob injection in IndexedDB via XSS | Tampering | Content-Type validation on upload; server-side virus scanning (future) |
| Photo metadata leaks location (EXIF GPS) | Information Disclosure | Strip EXIF data when resizing photos via Canvas before storage |

## Sources

### Primary (HIGH confidence)
- `node_modules/next-pwa/README.md` -- Complete API reference, configuration options, runtime caching defaults, offline fallback patterns [VERIFIED: local package docs]
- `node_modules/next-pwa/package.json` -- Version 5.6.0, peer dependency `next >=9.0.0`, dependencies on workbox-webpack-plugin v6.5.4 [VERIFIED: local package]
- `node_modules/next-pwa/cache.js` -- Default runtime caching strategies (14 rules for fonts, images, JS, CSS, API, cross-origin) [VERIFIED: local package source]
- `node_modules/idb/README.md` -- Complete API (openDB, DBSchema, transactions, indexes, cursors, async iterators) [VERIFIED: local package docs]
- `node_modules/idb/package.json` -- Version 8.0.3, TypeScript types at `build/index.d.ts` [VERIFIED: local package]
- `prisma/schema.prisma` -- 13 models with full relationships, enums including SyncStatus, TipoMidia, StatusVistoria [VERIFIED: project source]
- `SYSTEM_DESIGN.md` section 6 -- PWA and offline flow specification (preload, IndexedDB, background sync) [VERIFIED: project docs]
- `DESIGN.md` section 2.1-2.4 -- Design tokens (#00AEEF, #1A2B3C, #F8FAFC, #FFB703), semantic colors, badge patterns [VERIFIED: project docs]
- `src/middleware.ts` -- Role-based route protection for /field/* requiring VISTORIADOR [VERIFIED: project source]
- `src/lib/auth.ts` -- NextAuth JWT strategy with role and empresaId in token [VERIFIED: project source]
- `npm view idb version` -- 8.0.3 (latest) matches installed [VERIFIED: npm registry]
- `npm view next-pwa version` -- 5.6.0 (latest) matches installed [VERIFIED: npm registry]

### Secondary (MEDIUM confidence)
- MDN MediaRecorder API documentation -- `isTypeSupported()`, mimeType negotiation, `ondataavailable` event patterns [CITED: developer.mozilla.org]
- MDN `<input capture>` specification -- `capture="environment"` attribute, `accept="image/*"` for camera [CITED: developer.mozilla.org]
- Workbox v6 documentation (referenced by next-pwa README) -- GenerateSW, InjectManifest, RuntimeCaching, BackgroundSync plugin [CITED: developer.chrome.com/docs/workbox]

### Tertiary (LOW confidence)
- MediaRecorder Safari iOS support timeline -- exact version cutoff not verified; based on training knowledge [ASSUMED]
- IndexedDB quota behavior on low-end Android devices -- specific limits not tested on target hardware [ASSUMED]
- Browser market share for field inspectors in Brazil -- assumption that Chrome Android dominates [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Both key libraries (next-pwa, idb) verified locally with full documentation; versions confirmed against npm registry
- Architecture: HIGH -- Offline-first pattern with IndexedDB + sync queue is the industry standard; next-pwa integration pattern confirmed from official docs and SYSTEM_DESIGN.md
- Pitfalls: MEDIUM -- Transaction auto-close and MediaRecorder compatibility are well-documented; iOS-specific limitations are known but exact Safari version cutoff is unverified (assumption A3)

**Research date:** 2026-07-14
**Valid until:** 2026-08-14 (30 days -- next-pwa and idb are stable; browser APIs change slowly)

**Impact on Phase 2:** The primary risk is client/server component boundary handling. The field pages require `'use client'` directive. Next.js 15 uses `params: Promise<{...}>` for dynamic routes (already confirmed in existing field pages). Turbopack vs webpack for dev may affect next-pwa's webpack plugin behavior.

## UI Architecture (from Lovable reference)

### Layout Pattern
- **Mockup Container:** `max-w-[430px] mx-auto` e bordas arredondadas simulam o mockup mobile. Em ambiente desktop, isso centraliza a aplicação garantindo a experiência mobile-first.
- **Status Bar:** Falsa barra com hora (9:41) e ícones de sinal, wi-fi e bateria (definidos em `PhoneShell.tsx`).
- **Navegação Inferior (Bottom Nav):** 4 abas (Home, Rooms, Sync, Report) com estilo ativo `text-primary`. A área útil de scroll do conteúdo precisa de `pb-24` para evitar sobreposição da barra.
- **TopBar:** Padrão `← [Título] [Ação]` onde o botão esquerdo aponta para a rota anterior (`backTo`) e o direito possui opções de contexto.

### Capture Screen Architecture
- **Viewfinder Escuro:** Estilo fotográfico com fundo gradiente escuro (`#16222f` a `#0b1119`) e proporção vertical esticada.
- **Grid de Enquadramento:** Divisão 3x3 para auxiliar no alinhamento das fotos dos itens.
- **Marcadores de Canto (Corner brackets):** Elementos absolutos com bordas parciais de `2px` em branco com opacidade.
- **Waveform de Áudio:** Painel flutuante com waveform simulado em progresso (25 barras verticais com opacidade dinâmica) e contador de tempo no formato `MM:SS`.
- **FAB Row:** Menu flutuante inferior com ações rápidas para Notas, Áudio e Etiquetas/Avarias.

### Color Token Mapping (hex → Tailwind CSS)
| Decision / UI Element | Variable in `styles.css` | Value (oklch / hex) | Usage in Project |
|---|---|---|---|
| Primary CTA | `--primary` | `#00aeef` | `bg-primary` / `text-primary` |
| Hover state | -- | `#009acd` | Botões ativos hover |
| Main Dark Texts & Headers | `--secondary` | `#1a2b3c` | `text-secondary` / `bg-secondary` |
| Background color | `--background` | `#f8fafc` | Fundo principal da página |
| Accent highlight | `--brand-accent` | `#ffb703` | Ícone do calendário, status de aviso |
| Sync: OK | `--status-good` | `#16a34a` | Badge de sincronizado |
| Sync: Local | `--status-warn` | `#d97706` | Badge de salvo no aparelho |
| Sync: Erro | `--status-bad` | `#dc2626` | Badge de erro de rede |
| Audio recording active | `--whatsapp` | `#25d366` | Cor do botão de gravação |
| Material Symbols icon standard | `--font-sans` | "Inter" | Fonte principal |

