import type { ImportedPentestCapability } from '../types.js'
import { ACTIVE_DIRECTORY_PACK_TOOLS } from './active-directory.js'
import { API_PACK_TOOLS } from './api.js'
import { BINARY_PACK_TOOLS } from './binary.js'
import { CLOUD_PACK_TOOLS } from './cloud.js'
import { COORDINATION_PACK_TOOLS } from './coordination.js'
import { EVIDENCE_PACK_TOOLS } from './evidence.js'
import { EXPLOITATION_PACK_TOOLS } from './exploitation.js'
import { LATERAL_MOVEMENT_PACK_TOOLS } from './lateral-movement.js'
import { MOBILE_PACK_TOOLS } from './mobile.js'
import { NETWORK_PACK_TOOLS } from './network.js'
import { RECON_PACK_TOOLS } from './recon.js'
import { WEB_PACK_TOOLS } from './web.js'
import { WIFI_PACK_TOOLS } from './wifi.js'

export const ALL_PACK_TOOLS: ImportedPentestCapability[] = [
  ...ACTIVE_DIRECTORY_PACK_TOOLS,
  ...API_PACK_TOOLS,
  ...BINARY_PACK_TOOLS,
  ...CLOUD_PACK_TOOLS,
  ...COORDINATION_PACK_TOOLS,
  ...EVIDENCE_PACK_TOOLS,
  ...EXPLOITATION_PACK_TOOLS,
  ...LATERAL_MOVEMENT_PACK_TOOLS,
  ...MOBILE_PACK_TOOLS,
  ...NETWORK_PACK_TOOLS,
  ...RECON_PACK_TOOLS,
  ...WEB_PACK_TOOLS,
  ...WIFI_PACK_TOOLS,
]

export { ACTIVE_DIRECTORY_PACK_TOOLS } from './active-directory.js'
export { API_PACK_TOOLS } from './api.js'
export { BINARY_PACK_TOOLS } from './binary.js'
export { CLOUD_PACK_TOOLS } from './cloud.js'
export { COORDINATION_PACK_TOOLS } from './coordination.js'
export { EVIDENCE_PACK_TOOLS } from './evidence.js'
export { EXPLOITATION_PACK_TOOLS } from './exploitation.js'
export { LATERAL_MOVEMENT_PACK_TOOLS } from './lateral-movement.js'
export { MOBILE_PACK_TOOLS } from './mobile.js'
export { NETWORK_PACK_TOOLS } from './network.js'
export { RECON_PACK_TOOLS } from './recon.js'
export { WEB_PACK_TOOLS } from './web.js'
export { WIFI_PACK_TOOLS } from './wifi.js'
