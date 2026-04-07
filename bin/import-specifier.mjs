import { resolve, sep, win32 } from 'path'
import { pathToFileURL } from 'url'

function isWindowsAbsolutePath(value) {
  return /^[A-Za-z]:\\/.test(value)
}

export function getDistImportSpecifier(baseDir) {
  if (isWindowsAbsolutePath(baseDir)) {
    const normalizedBaseDir = win32.resolve(baseDir).replace(/\\/g, '/')
    return new URL('../dist/cli.mjs', pathToFileURL(`/${normalizedBaseDir}/`)).href
  }

  const normalizedBaseDir = resolve(baseDir)
  return new URL('../dist/cli.mjs', pathToFileURL(`${normalizedBaseDir}${sep}`)).href
}
