import WorkerUrl from "@pierre/diffs/worker/worker.js?worker&url";

/** Vite-emitted module worker for @pierre/diffs WorkerPoolContextProvider. */
export function workerFactory(): Worker {
  return new Worker(WorkerUrl, { type: "module" });
}
