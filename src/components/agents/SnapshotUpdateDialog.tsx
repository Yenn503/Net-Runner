// Stub — snapshot update UI not included in source snapshot.
import React from 'react'
import type { AgentMemoryScope } from '../../tools/AgentTool/agentMemory.js'

export interface SnapshotUpdateDialogProps {
  agentType: string
  scope: AgentMemoryScope
  snapshotTimestamp: string
  onComplete: (choice: 'merge' | 'keep' | 'replace') => void
  onCancel: () => void
}

export function SnapshotUpdateDialog(
  _props: SnapshotUpdateDialogProps,
): React.ReactNode {
  return null
}
