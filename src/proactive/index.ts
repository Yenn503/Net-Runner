type Listener = () => void

const listeners = new Set<Listener>()
let proactiveActive = false
let proactivePaused = false
let nextTickAt: number | null = null

function notifyListeners(): void {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeToProactiveChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isProactiveActive(): boolean {
  return proactiveActive
}

export function isProactivePaused(): boolean {
  return proactivePaused
}

export function getNextTickAt(): number | null {
  return nextTickAt
}

export function activateProactive(_source?: string): void {
  proactiveActive = true
  proactivePaused = false
  notifyListeners()
}

export function deactivateProactive(): void {
  proactiveActive = false
  proactivePaused = false
  nextTickAt = null
  notifyListeners()
}

export function pauseProactive(): void {
  proactivePaused = true
  notifyListeners()
}

export function resumeProactive(): void {
  proactivePaused = false
  notifyListeners()
}

export function setContextBlocked(_blocked: boolean): void {}
