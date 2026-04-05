/**
 * MCTS Attack Path Planner — Monte Carlo Tree Search for optimal attack path discovery.
 *
 * Models a penetration test as a decision tree where:
 * - Nodes represent attack states (discovered ports, vulns, credentials, access level)
 * - Edges represent attack actions (scan, exploit, privesc, lateral move)
 * - UCB1 balances exploitation of known-good paths vs exploration of unknowns
 *
 * Redesigned from AutoRedTeam-Orchestrator's mcts_planner.py for Net-Runner's
 * LLM-native agent system. Instead of driving tools directly, the planner produces
 * ranked action recommendations that the engagement-lead uses for specialist routing.
 *
 * Key improvements over ART's implementation:
 * - Agent-aware actions (each action maps to a Net-Runner specialist agent)
 * - Skill-aware rewards (integrates with skill definitions)
 * - Structured output for LLM consumption
 * - No external dependencies
 */

import { createHash } from 'node:crypto'

// ---------------------------------------------------------------------------
// Action types aligned with Net-Runner specialist agents
// ---------------------------------------------------------------------------

export type ActionType =
  | 'port-scan'
  | 'service-detect'
  | 'vuln-scan'
  | 'web-scan'
  | 'api-scan'
  | 'brute-force'
  | 'exploit'
  | 'privesc'
  | 'lateral-move'
  | 'credential-dump'
  | 'data-exfil'
  | 'ad-attack'
  | 'waf-detect'

export type Action = {
  type: ActionType
  name: string
  tool: string
  agent: string
  params: Record<string, unknown>
  riskScore: number
  estimatedReward: number
}

// ---------------------------------------------------------------------------
// Attack state
// ---------------------------------------------------------------------------

export type VulnInfo = {
  id: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  type: string
  description?: string
}

export type CredentialInfo = {
  username: string
  credType: 'password' | 'hash' | 'token' | 'key'
  service?: string
}

export class AttackState {
  target: string
  targetType: 'ip' | 'domain' | 'url' | 'network'
  openPorts: Map<number, string> = new Map()
  technologies: string[] = []
  vulnerabilities: VulnInfo[] = []
  credentials: CredentialInfo[] = []
  accessLevel: number = 0 // 0=none, 1=user, 2=root/admin
  completedActions: Set<string> = new Set()
  findings: Array<Record<string, unknown>> = []
  private hashCache: string | null = null

  constructor(target: string, targetType: 'ip' | 'domain' | 'url' | 'network') {
    this.target = target
    this.targetType = targetType
  }

  addOpenPort(port: number, service = 'unknown'): void {
    this.hashCache = null
    this.openPorts.set(port, service)
  }

  addVulnerability(vuln: VulnInfo): void {
    this.hashCache = null
    this.vulnerabilities.push(vuln)
  }

  addCredential(cred: CredentialInfo): void {
    this.hashCache = null
    this.credentials.push(cred)
  }

  markActionComplete(actionKey: string): void {
    this.hashCache = null
    this.completedActions.add(actionKey)
  }

  stateHash(): string {
    if (this.hashCache !== null) return this.hashCache
    const ports = Array.from(this.openPorts.entries()).sort((a, b) => a[0] - b[0])
    const actions = Array.from(this.completedActions).sort()
    const str = `${this.target}|${this.targetType}|${JSON.stringify(ports)}|${this.vulnerabilities.length}|${this.credentials.length}|${this.accessLevel}|${JSON.stringify(actions)}`
    this.hashCache = createHash('md5').update(str).digest('hex').slice(0, 12)
    return this.hashCache
  }

  clone(): AttackState {
    const s = new AttackState(this.target, this.targetType)
    s.openPorts = new Map(this.openPorts)
    s.technologies = this.technologies.slice()
    s.vulnerabilities = this.vulnerabilities.slice()
    s.credentials = this.credentials.slice()
    s.accessLevel = this.accessLevel
    s.completedActions = new Set(this.completedActions)
    s.findings = this.findings.slice()
    return s
  }

  isTerminal(): boolean {
    return this.accessLevel >= 2
  }

  reward(): number {
    let r = 0
    r += Math.min(this.openPorts.size * 0.05, 0.2)
    for (const vuln of this.vulnerabilities) {
      const severityReward: Record<string, number> = { critical: 0.3, high: 0.2, medium: 0.1, low: 0.05, info: 0.01 }
      r += severityReward[vuln.severity] ?? 0.05
    }
    r += this.credentials.length * 0.15
    r += this.accessLevel * 0.25
    return Math.min(r, 1.0)
  }
}

// ---------------------------------------------------------------------------
// Action generator — maps state to available actions with agent assignments
// ---------------------------------------------------------------------------

const AGENT_MAP: Record<ActionType, string> = {
  'port-scan': 'recon-specialist',
  'service-detect': 'recon-specialist',
  'vuln-scan': 'web-testing-specialist',
  'web-scan': 'web-testing-specialist',
  'api-scan': 'api-testing-specialist',
  'brute-force': 'exploit-specialist',
  'exploit': 'exploit-specialist',
  'privesc': 'privilege-escalation-specialist',
  'lateral-move': 'lateral-movement-specialist',
  'credential-dump': 'exploit-specialist',
  'data-exfil': 'exploit-specialist',
  'ad-attack': 'ad-specialist',
  'waf-detect': 'recon-specialist',
}

export function getActionCompletionKey(action: Pick<Action, 'type' | 'params'>): string {
  switch (action.type) {
    case 'exploit':
      return `exploit-${(action.params['vulnId'] as string) ?? 'unknown'}`
    case 'brute-force':
      return `brute-${(action.params['port'] as number) ?? 0}`
    case 'vuln-scan':
      return 'vuln-scan-nuclei'
    default:
      return action.type
  }
}

export function generateActions(state: AttackState): Action[] {
  const actions: Action[] = []

  // Phase 1: Reconnaissance
  if (!state.completedActions.has('port-scan')) {
    actions.push({
      type: 'port-scan',
      name: 'TCP port scan',
      tool: 'nmap',
      agent: AGENT_MAP['port-scan'],
      params: { ports: 'top-1000' },
      riskScore: 0.1,
      estimatedReward: 0.3,
    })
  }

  if (state.openPorts.size > 0 && !state.completedActions.has('service-detect')) {
    actions.push({
      type: 'service-detect',
      name: 'Service version detection',
      tool: 'nmap',
      agent: AGENT_MAP['service-detect'],
      params: { flags: '-sV' },
      riskScore: 0.15,
      estimatedReward: 0.2,
    })
  }

  // WAF detection for web targets
  if ((state.openPorts.has(80) || state.openPorts.has(443) || state.targetType === 'url') && !state.completedActions.has('waf-detect')) {
    actions.push({
      type: 'waf-detect',
      name: 'WAF fingerprinting',
      tool: 'wafw00f',
      agent: AGENT_MAP['waf-detect'],
      params: {},
      riskScore: 0.1,
      estimatedReward: 0.15,
    })
  }

  // Phase 2: Vulnerability scanning
  if (state.openPorts.has(80) || state.openPorts.has(443) || state.openPorts.has(8080) || state.openPorts.has(8443)) {
    if (!state.completedActions.has('web-scan')) {
      actions.push({
        type: 'web-scan',
        name: 'Web vulnerability scan',
        tool: 'nikto',
        agent: AGENT_MAP['web-scan'],
        params: {},
        riskScore: 0.3,
        estimatedReward: 0.4,
      })
    }
    if (!state.completedActions.has('vuln-scan-nuclei')) {
      actions.push({
        type: 'vuln-scan',
        name: 'Template-based vuln scan',
        tool: 'nuclei',
        agent: AGENT_MAP['vuln-scan'],
        params: { templates: 'cves,vulnerabilities' },
        riskScore: 0.25,
        estimatedReward: 0.45,
      })
    }
  }

  // API scanning
  if (state.technologies.some(t => /api|rest|graphql|swagger|openapi/i.test(t))) {
    if (!state.completedActions.has('api-scan')) {
      actions.push({
        type: 'api-scan',
        name: 'API security scan',
        tool: 'api-fuzzer',
        agent: AGENT_MAP['api-scan'],
        params: {},
        riskScore: 0.3,
        estimatedReward: 0.35,
      })
    }
  }

  // Phase 3: Exploitation
  if (state.vulnerabilities.length > 0) {
    const criticalVulns = state.vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high')
    for (const vuln of criticalVulns) {
      const actionKey = `exploit-${vuln.id}`
      if (!state.completedActions.has(actionKey)) {
        actions.push({
          type: 'exploit',
          name: `Exploit ${vuln.type}: ${vuln.id}`,
          tool: 'metasploit',
          agent: AGENT_MAP['exploit'],
          params: { vulnId: vuln.id, vulnType: vuln.type },
          riskScore: 0.7,
          estimatedReward: 0.6,
        })
      }
    }
  }

  // Brute force for auth services
  const authPorts = [21, 22, 23, 3389, 5900, 3306, 5432, 1433, 27017]
  for (const [port, service] of Array.from(state.openPorts.entries())) {
    if (authPorts.includes(port) && !state.completedActions.has(`brute-${port}`)) {
      actions.push({
        type: 'brute-force',
        name: `Brute-force ${service} on port ${port}`,
        tool: 'hydra',
        agent: AGENT_MAP['brute-force'],
        params: { port, service },
        riskScore: 0.6,
        estimatedReward: 0.4,
      })
    }
  }

  // Phase 4: Post-exploitation
  if (state.accessLevel >= 1) {
    if (!state.completedActions.has('privesc')) {
      actions.push({
        type: 'privesc',
        name: 'Privilege escalation',
        tool: 'linpeas',
        agent: AGENT_MAP['privesc'],
        params: {},
        riskScore: 0.7,
        estimatedReward: 0.5,
      })
    }
    if (!state.completedActions.has('credential-dump')) {
      actions.push({
        type: 'credential-dump',
        name: 'Credential extraction',
        tool: 'mimikatz',
        agent: AGENT_MAP['credential-dump'],
        params: {},
        riskScore: 0.8,
        estimatedReward: 0.45,
      })
    }
  }

  // Phase 5: Lateral movement (with credentials)
  if (state.credentials.length > 0 && !state.completedActions.has('lateral-move')) {
    actions.push({
      type: 'lateral-move',
      name: 'Lateral movement with harvested credentials',
      tool: 'netexec',
      agent: AGENT_MAP['lateral-move'],
      params: {},
      riskScore: 0.8,
      estimatedReward: 0.5,
    })
  }

  // AD attacks
  if (state.openPorts.has(88) || state.openPorts.has(389) || state.openPorts.has(636)) {
    if (!state.completedActions.has('ad-attack')) {
      actions.push({
        type: 'ad-attack',
        name: 'Active Directory enumeration and attack',
        tool: 'bloodhound',
        agent: AGENT_MAP['ad-attack'],
        params: {},
        riskScore: 0.6,
        estimatedReward: 0.55,
      })
    }
  }

  return actions
}

// ---------------------------------------------------------------------------
// Attack simulator — simulates action outcomes for MCTS rollout
// ---------------------------------------------------------------------------

export function simulateAction(state: AttackState, action: Action): AttackState {
  const newState = state.clone()
  const rand = Math.random()

  newState.markActionComplete(getActionCompletionKey(action))

  switch (action.type) {
    case 'port-scan': {
      const commonPorts = [21, 22, 25, 53, 80, 110, 143, 443, 445, 993, 995, 3306, 3389, 5432, 8080, 8443]
      const discovered = commonPorts.filter(() => Math.random() < 0.3)
      for (const p of discovered) {
        newState.addOpenPort(p, 'unknown')
      }
      break
    }
    case 'service-detect': {
      const services: Record<number, string> = { 21: 'ftp', 22: 'ssh', 25: 'smtp', 53: 'dns', 80: 'http', 110: 'pop3', 143: 'imap', 443: 'https', 445: 'smb', 3306: 'mysql', 3389: 'rdp', 5432: 'postgresql', 8080: 'http-proxy', 8443: 'https-alt' }
      for (const [port] of Array.from(newState.openPorts.entries())) {
        if (services[port]) newState.openPorts.set(port, services[port]!)
      }
      break
    }
    case 'waf-detect':
      if (rand < 0.3) newState.technologies.push('waf-cloudflare')
      break
    case 'web-scan':
    case 'vuln-scan': {
      if (rand < 0.6) {
        const types = ['sqli', 'xss', 'lfi', 'rce', 'ssrf', 'xxe']
        const sevs: Array<VulnInfo['severity']> = ['critical', 'high', 'medium', 'low']
        const type = types[Math.floor(Math.random() * types.length)]!
        const sev = sevs[Math.floor(Math.random() * sevs.length)]!
        newState.addVulnerability({ id: `VULN-${Math.floor(Math.random() * 9999)}`, severity: sev, type })
      }
      break
    }
    case 'api-scan':
      if (rand < 0.5) {
        newState.addVulnerability({ id: `API-${Math.floor(Math.random() * 999)}`, severity: 'medium', type: 'idor' })
      }
      break
    case 'exploit':
      if (rand < 0.4) {
        newState.accessLevel = Math.max(newState.accessLevel, 1)
      }
      break
    case 'brute-force':
      if (rand < 0.2) {
        newState.addCredential({ username: 'admin', credType: 'password', service: action.params['service'] as string })
        newState.accessLevel = Math.max(newState.accessLevel, 1)
      }
      break
    case 'privesc':
      if (rand < 0.35 && newState.accessLevel >= 1) {
        newState.accessLevel = 2
      }
      break
    case 'credential-dump':
      if (rand < 0.5 && newState.accessLevel >= 1) {
        newState.addCredential({ username: 'svc-account', credType: 'hash' })
      }
      break
    case 'lateral-move':
      if (rand < 0.3 && newState.credentials.length > 0) {
        newState.accessLevel = Math.max(newState.accessLevel, 1)
        newState.addOpenPort(445, 'smb')
      }
      break
    case 'ad-attack':
      if (rand < 0.4) {
        newState.addVulnerability({ id: 'AD-KERBEROAST', severity: 'high', type: 'kerberoasting' })
      }
      break
  }

  return newState
}

// ---------------------------------------------------------------------------
// MCTS Node
// ---------------------------------------------------------------------------

class MCTSNode {
  state: AttackState
  action: Action | null
  parent: MCTSNode | null
  children: MCTSNode[] = []
  visits = 0
  totalReward = 0
  /** @internal */ untriedActions: Action[] | null = null

  constructor(state: AttackState, action: Action | null = null, parent: MCTSNode | null = null) {
    this.state = state
    this.action = action
    this.parent = parent
  }

  get isFullyExpanded(): boolean {
    return this.getUntriedActions().length === 0
  }

  get averageReward(): number {
    return this.visits > 0 ? this.totalReward / this.visits : 0
  }

  getUntriedActions(): Action[] {
    if (this.untriedActions === null) {
      const tried = new Set(this.children.map(c => `${c.action?.type}-${c.action?.name}`))
      this.untriedActions = generateActions(this.state).filter(a => !tried.has(`${a.type}-${a.name}`))
    }
    return this.untriedActions
  }

  ucb1(explorationWeight: number): number {
    if (this.visits === 0) return Infinity
    const parentVisits = this.parent?.visits ?? 1
    return this.averageReward + explorationWeight * Math.sqrt(Math.log(parentVisits) / this.visits)
  }
}

// ---------------------------------------------------------------------------
// MCTS Planner
// ---------------------------------------------------------------------------

export type MCTSOptions = {
  maxIterations?: number
  explorationWeight?: number
  maxDepth?: number
}

export type ActionRanking = {
  action: Action
  visits: number
  averageReward: number
  confidence: number
}

export type MCTSResult = {
  bestPath: Action[]
  actionRankings: ActionRanking[]
  iterations: number
  totalSimulations: number
  terminalReached: boolean
  recommendation: string
}

export class MCTSPlanner {
  private maxIterations: number
  private explorationWeight: number
  private maxDepth: number
  private transpositionTable = new Map<string, number>()

  constructor(options: MCTSOptions = {}) {
    this.maxIterations = options.maxIterations ?? 500
    this.explorationWeight = options.explorationWeight ?? Math.SQRT2
    this.maxDepth = options.maxDepth ?? 15
  }

  plan(initialState: AttackState): MCTSResult {
    const root = new MCTSNode(initialState)
    let totalSimulations = 0

    for (let i = 0; i < this.maxIterations; i++) {
      // Selection
      let node = this.select(root)

      // Expansion
      if (!node.state.isTerminal() && node.getUntriedActions().length > 0) {
        node = this.expand(node)
      }

      // Simulation (rollout)
      const reward = this.simulate(node.state)
      totalSimulations++

      // Backpropagation
      this.backpropagate(node, reward)
    }

    // Extract results
    const actionRankings = this.getRankings(root)
    const bestPath = this.extractBestPath(root)
    const terminalReached = bestPath.length > 0 && this.wouldReachTerminal(initialState, bestPath)

    const topAction = actionRankings[0]
    const recommendation = topAction
      ? `Recommended: ${topAction.action.name} (${topAction.action.tool}) via ${topAction.action.agent}. ` +
        `Expected reward: ${(topAction.averageReward * 100).toFixed(0)}%, ` +
        `confidence: ${(topAction.confidence * 100).toFixed(0)}%.`
      : 'No viable attack paths found from current state.'

    return {
      bestPath,
      actionRankings,
      iterations: this.maxIterations,
      totalSimulations,
      terminalReached,
      recommendation,
    }
  }

  private select(node: MCTSNode): MCTSNode {
    let current = node
    let depth = 0
    while (!current.state.isTerminal() && current.isFullyExpanded && current.children.length > 0 && depth < this.maxDepth) {
      current = this.bestUCB1Child(current)
      depth++
    }
    return current
  }

  private expand(node: MCTSNode): MCTSNode {
    const untried = node.getUntriedActions()
    if (untried.length === 0) return node

    const action = untried[Math.floor(Math.random() * untried.length)]!
    const newState = simulateAction(node.state, action)
    const child = new MCTSNode(newState, action, node)
    node.children.push(child)

    // Clear cached untried actions since we added a child
    node.untriedActions = null

    return child
  }

  private simulate(state: AttackState): number {
    // Check transposition table
    const hash = state.stateHash()
    if (this.transpositionTable.has(hash)) {
      return this.transpositionTable.get(hash)!
    }

    let current = state.clone()
    let depth = 0

    while (!current.isTerminal() && depth < this.maxDepth) {
      const actions = generateActions(current)
      if (actions.length === 0) break

      const action = actions[Math.floor(Math.random() * actions.length)]!
      current = simulateAction(current, action)
      depth++
    }

    const reward = current.reward()
    this.transpositionTable.set(hash, reward)
    return reward
  }

  private backpropagate(node: MCTSNode, reward: number): void {
    let current: MCTSNode | null = node
    while (current !== null) {
      current.visits++
      current.totalReward += reward
      current = current.parent
    }
  }

  private bestUCB1Child(node: MCTSNode): MCTSNode {
    let bestChild = node.children[0]!
    let bestScore = -Infinity
    for (const child of node.children) {
      const score = child.ucb1(this.explorationWeight)
      if (score > bestScore) {
        bestScore = score
        bestChild = child
      }
    }
    return bestChild
  }

  private getRankings(root: MCTSNode): ActionRanking[] {
    if (root.children.length === 0) return []

    const totalVisits = root.children.reduce((sum, c) => sum + c.visits, 0)

    return root.children
      .filter(c => c.action !== null)
      .map(c => ({
        action: c.action!,
        visits: c.visits,
        averageReward: Number(c.averageReward.toFixed(4)),
        confidence: totalVisits > 0 ? Number((c.visits / totalVisits).toFixed(4)) : 0,
      }))
      .sort((a, b) => b.visits - a.visits)
  }

  private extractBestPath(root: MCTSNode): Action[] {
    const path: Action[] = []
    let current = root
    while (current.children.length > 0) {
      let bestChild = current.children[0]!
      for (const child of current.children) {
        if (child.visits > bestChild.visits) bestChild = child
      }
      if (bestChild.action) path.push(bestChild.action)
      current = bestChild
    }
    return path
  }

  private wouldReachTerminal(state: AttackState, path: Action[]): boolean {
    let current = state.clone()
    for (const action of path) {
      current = simulateAction(current, action)
    }
    return current.isTerminal()
  }

  /** Reset the transposition table (call between targets). */
  reset(): void {
    this.transpositionTable.clear()
  }
}

// ---------------------------------------------------------------------------
// Format MCTS result for agent prompt injection
// ---------------------------------------------------------------------------

export function formatMCTSResultForAgent(result: MCTSResult): string {
  const lines = [
    '[Attack Path Analysis — MCTS Planner]',
    `Iterations: ${result.iterations}, simulations: ${result.totalSimulations}`,
    `Terminal state (root/admin) ${result.terminalReached ? 'REACHABLE' : 'not reached in simulated paths'}.`,
    '',
    'Ranked next actions:',
  ]

  for (let i = 0; i < Math.min(result.actionRankings.length, 5); i++) {
    const r = result.actionRankings[i]!
    lines.push(
      `  ${i + 1}. ${r.action.name} (tool: ${r.action.tool}, agent: ${r.action.agent})` +
      ` — reward: ${(r.averageReward * 100).toFixed(0)}%, confidence: ${(r.confidence * 100).toFixed(0)}%, risk: ${(r.action.riskScore * 100).toFixed(0)}%`,
    )
  }

  if (result.bestPath.length > 0) {
    lines.push('', 'Optimal path:')
    for (let i = 0; i < result.bestPath.length; i++) {
      const a = result.bestPath[i]!
      lines.push(`  ${i + 1}. ${a.name} → ${a.agent}`)
    }
  }

  lines.push('', result.recommendation)
  return lines.join('\n')
}
