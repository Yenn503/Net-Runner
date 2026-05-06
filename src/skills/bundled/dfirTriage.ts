import { getNetRunnerSkillDefinition } from '../../security/skillDefinitions.js'
import { registerBundledSkill } from '../bundledSkills.js'

export function registerDfirTriageSkill(): void {
  const definition = getNetRunnerSkillDefinition('dfir-triage')
  if (!definition) throw new Error('Missing Net-Runner skill definition: dfir-triage')

  registerBundledSkill({
    name: definition.name,
    description: definition.description,
    allowedTools: ['Bash', 'Read', 'Write', 'TodoWrite', 'Grep', 'Glob', 'WebFetch', 'ListMcpResourcesTool', 'ReadMcpResourceTool'],
    argumentHint: '[incident identifier or artifact path]',
    async getPromptForCommand(args) {
      return [
        {
          type: 'text',
          text: `# DFIR Triage

Structured incident-response triage. Do not modify source artifacts. Hash before analysis.

Input:
${args || 'No incident ID or artifact path supplied. Ask for the authorized engagement target and artifact location first.'}

Execution:

## 1. Scope and manifest
1. Run \`nr_engagement_status\` and halt if \`nr_scope_check\` returns block.
2. Create evidence directory: \`.netrunner/artifacts/dfir/<incident-slug>/\`.

## 2. Acquisition and chain of custody
- Volatile-order collection (RAM → /proc → disk): collect RAM first.
  - Linux: \`sudo insmod lime.ko "path=/evidence/mem.lime format=lime"\` or \`avml /evidence/mem.raw\`
  - Windows: \`winpmem_mini_x64.exe /evidence/mem.raw\`
- Disk: attach with write-blocker; image with \`dc3dd if=/dev/sdX hash=sha256 hlog=/evidence/disk.sha256 bs=4M conv=sync,noerror of=/evidence/disk.img\` or \`dd if=/dev/sdX bs=4M conv=sync,noerror | tee >(sha256sum > /evidence/disk.sha256) > /evidence/disk.img\`
- Record SHA-256 of every source artifact before and after: \`sha256sum /evidence/mem.raw >> /evidence/hashes.log\`

## 3. Memory analysis (Volatility 3)
\`\`\`
vol -f /evidence/mem.raw windows.pslist
vol -f /evidence/mem.raw windows.netscan
vol -f /evidence/mem.raw windows.malfind
vol -f /evidence/mem.raw windows.cmdline
vol -f /evidence/mem.raw windows.dlllist
vol -f /evidence/mem.raw linux.pslist
vol -f /evidence/mem.raw linux.bash
\`\`\`
Save each output to \`/evidence/vol-<plugin>.txt\`.

## 4. Timeline (Plaso / log2timeline)
\`\`\`
log2timeline.py /evidence/timeline.plaso /evidence/disk.img
psort.py -o l2tcsv /evidence/timeline.plaso > /evidence/timeline.csv
\`\`\`
Cross-reference with mactime if TSK body file is available:
\`\`\`
fls -r -m / /evidence/disk.img > /evidence/bodyfile.txt
mactime -b /evidence/bodyfile.txt -d > /evidence/mactime.csv
\`\`\`

## 5. Windows event log analysis
\`\`\`
chainsaw hunt /evidence/evtx --sigma sigma_rules/ --output /evidence/chainsaw.json --json
hayabusa csv-timeline --directory /evidence/evtx --output /evidence/hayabusa.csv
evtx_dump /evidence/evtx/Security.evtx > /evidence/evtx-security.json
\`\`\`

## 6. Live triage (when authorized on live host)
- KAPE: \`kape.exe --tsource C: --tdest /evidence/kape --target KapeTriage\`
- Velociraptor: \`velociraptor artifacts collect Windows.KapeFiles.Targets --args Device=C: --output /evidence/velociraptor\`

## 7. Mobile forensics
- MVT (iOS): \`mvt-ios check-backup /evidence/backup --output /evidence/mvt-ios\`
- MVT (Android): \`mvt-android check-adb --output /evidence/mvt-android\`
- ALEAPP (Android): \`aleapp -t tar -i /evidence/backup.tar -o /evidence/aleapp\`
- iLEAPP (iOS): \`ileapp -t tar -i /evidence/backup.tar -o /evidence/ileapp\`

## 8. File carving
\`\`\`
bulk_extractor -o /evidence/bulk_extractor /evidence/disk.img
photorec /evidence/disk.img
scalpel /evidence/disk.img -o /evidence/scalpel
\`\`\`

## 9. YARA scan
\`\`\`
yara -r /evidence/rules.yar /evidence/disk.img > /evidence/yara-hits.txt
yara -r /evidence/rules.yar /evidence/bulk_extractor/ >> /evidence/yara-hits.txt
\`\`\`

## 10. Filesystem (Sleuth Kit)
\`\`\`
mmls /evidence/disk.img
fls -r /evidence/disk.img > /evidence/fls.txt
icat /evidence/disk.img <inode> > /evidence/extracted-file
\`\`\`

## 11. IOC extraction and ATT&CK mapping
- Parse all outputs for IPs, domains, hashes, registry keys, process names, and file paths.
- Map each IOC to a MITRE ATT&CK technique ID and tactic.
- Write \`/evidence/iocs.json\` with fields: \`ioc\`, \`type\`, \`technique\`, \`tactic\`, \`confidence\`, \`source_artifact\`.

## 12. Output
- \`/evidence/timeline.csv\` — merged timeline
- \`/evidence/iocs.json\` — structured IOC list with ATT&CK mapping
- \`/evidence/hashes.log\` — chain-of-custody hash log
- Call \`nr_save_finding\` for each confirmed IOC.
- Call \`nr_save_note\` with hypothesis log and gaps.

Output summary:
- Scope decision
- Artifact acquisition status and hashes
- Memory analysis highlights
- Timeline span and key events
- Confirmed IOCs with ATT&CK techniques
- Gaps requiring additional collection`,
        },
      ]
    },
  })
}
