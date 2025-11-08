#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Paths
const repoRoot = path.resolve(__dirname, '..')
const frontendPkgPath = path.join(repoRoot, 'frontend', 'package.json')
const frontendPublicDir = path.join(repoRoot, 'frontend', 'public')
const outputFrontendPath = path.join(frontendPublicDir, 'open-source.json')

function readPackageJson() {
  try {
    const raw = fs.readFileSync(frontendPkgPath, 'utf8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read frontend package.json', err)
    process.exit(2)
  }
}

function buildPackages(pkg) {
  const deps = pkg.dependencies || {}
  const devDeps = pkg.devDependencies || {}

  const packages = []
  Object.keys(deps).forEach(name => packages.push({ name, version: deps[name], dev: false }))
  Object.keys(devDeps).forEach(name => packages.push({ name, version: devDeps[name], dev: true }))
  return packages.sort((a, b) => a.name.localeCompare(b.name))
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function writeOutput(packages) {
  const payload = {
    generatedAt: new Date().toISOString(),
    packages
  }

  // Write into the frontend public folder only if packages changed
  try {
    ensureDir(frontendPublicDir)

    if (fs.existsSync(outputFrontendPath)) {
      try {
        const existingRaw = fs.readFileSync(outputFrontendPath, 'utf8')
        const existing = JSON.parse(existingRaw)
        // Compare only the packages arrays (ignore generatedAt)
        if (JSON.stringify(existing.packages) === JSON.stringify(packages)) {
          console.log('open-source.json unchanged; skipping write.')
          return
        }
      } catch (err) {
        // If parsing fails, fall through and rewrite the file
        console.warn('Existing open-source.json could not be parsed; rewriting.')
      }
    }

    fs.writeFileSync(outputFrontendPath, JSON.stringify(payload, null, 2), 'utf8')
    console.log('Wrote open-source list to frontend public at', outputFrontendPath)
  } catch (err) {
    console.error('Failed to write open-source to frontend public:', err)
    process.exit(2)
  }
}

function main() {
  const pkg = readPackageJson()
  const packages = buildPackages(pkg)
  writeOutput(packages)
}

main()
