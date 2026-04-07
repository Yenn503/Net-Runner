export type MonitorMcpTaskState = {
  type: 'monitor_mcp'
  status: 'pending' | 'running' | 'completed' | 'failed'
}
