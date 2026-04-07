export type LocalWorkflowTaskState = {
  type: 'local_workflow'
  status: 'pending' | 'running' | 'completed' | 'failed'
}
