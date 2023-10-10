#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

import minify from './minify-zip.js'

const files = new Set(process.argv.slice(2).map(e => path.resolve(e)))
const writes = []
for (const filePath of files) {
  console.log(filePath)
  try {
    const before = await fs.promises.readFile(filePath)
    console.time('Minify time')
    const after = minify(before)
    console.timeEnd('Minify time')
    console.log('Before:     ', before.byteLength, 'bytes')
    console.log('After:      ', after.byteLength, 'bytes', '(' + (after.byteLength / before.byteLength * 100).toFixed(2) + '%)')
    console.log('Saved:      ', before.byteLength - after.byteLength, 'bytes', '(' + ((before.byteLength - after.byteLength) / before.byteLength * 100).toFixed(2) + '%)')
    console.log()
    writes.push(fs.promises.writeFile(filePath, after))
  } catch (err) {
    console.error(err)
  }
}

await Promise.all(writes)
