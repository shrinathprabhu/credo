import assert from "node:assert/strict";
import { Worker as NodeWorker } from "node:worker_threads";

// Exercise the browser branch and the actual worker source using real threads,
// including all existing format, tampering, and legacy compatibility checks.
let activeWorkers = 0;
let completedWorkers = 0;
class BrowserWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  thread: NodeWorker;

  constructor(url: URL) {
    activeWorkers++;
    const bridge = `
      import { parentPort } from "node:worker_threads";
      globalThis.self = {
        postMessage: (data, options) => parentPort.postMessage(data, options?.transfer),
      };
      await import(${JSON.stringify(url.href)});
      parentPort.on("message", data => self.onmessage({ data }));
    `;
    this.thread = new NodeWorker(new URL(`data:text/javascript,${encodeURIComponent(bridge)}`));
    this.thread.on("message", data => {
      completedWorkers++;
      this.onmessage?.({ data });
    });
    this.thread.on("error", () => this.onerror?.());
    this.thread.on("messageerror", () => this.onmessageerror?.());
  }

  postMessage(data: unknown) { this.thread.postMessage(data); }
  terminate() {
    activeWorkers--;
    void this.thread.terminate();
  }
}

Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
Object.defineProperty(globalThis, "Worker", { value: BrowserWorker, configurable: true });
let ticks = 0;
const timer = setInterval(() => ticks++, 10);
try {
  await import("./crypto.test.mts");
  assert.ok(completedWorkers > 0, "encryption and decryption must use workers");
  assert.equal(activeWorkers, 0, "workers must be terminated after each derivation");
  assert.ok(ticks > 10, "the calling thread must keep processing timers during key derivation");
  console.log("PASS  worker compatibility, cleanup, and responsive calling thread");
} finally {
  clearInterval(timer);
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "Worker");
}
