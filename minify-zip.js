/**
 * Minifies a ZIP file by removing some parts that are usually unnecessary:
 * - Directory records
 * - Extra fields
 * - Comments
 * 
 * Removing these will be fine in most cases, but may break ZIP files that...
 * - Are larger than 4 GB
 * - Have important empty directories
 * - Are encrypted
 * - Contain file names with unicode characters
 * - Store other important information in extra fields or comments
 * 
 * If any of these apply to a ZIP file, minifying it will remove parts that
 * may be essential. Some tools may require some of these parts for extra
 * functionality. For example, 7-Zip uses the extra fields to store things
 * like the creation date for files, which is not essential, but allows 7-Zip
 * to display the date in the GUI and to add it to the file when extracting.
 * @param {Buffer} buf ZIP file Buffer
 * @returns {Buffer} A minified ZIP file Buffer
 */
export default function(buf) {
  //TODO: Use a better method for finding the EOCD offset.
  // This one will have problems if the EOCD comment contains these bytes.
  const offEOCD = buf.lastIndexOf('504b0506', buf.length - 22, 'hex')
  const offCenDir = buf.readUint32LE(offEOCD + 16)
  const recordCount = buf.readUint16LE(offEOCD + 10)

  const records = []
  const cenDir = []
  let ro = 0, cds = 0
  for (let i = 0, o = offCenDir; i < recordCount; i++) {
    const n = buf.readUint16LE(o + 28) // Name length
    const m = buf.readUint16LE(o + 30) // Extra field length
    const k = buf.readUint16LE(o + 32) // Comment length
    const filePath = buf.toString('utf8', o + 46, o + 46 + n)

    // Ignore directory records
    if (filePath.endsWith('/')) {
      o += 46 + n + m + k
      continue
    }

    const h = buf.readUint32LE(o + 42) // Local header offset
    const s = buf.readUint32LE(h + 18) // Compressed size
    const e = buf.readUint16LE(h + 28) // Local header extra field length

    const rec = Buffer.concat([
      buf.subarray(h, h + 30 + n), // Header
      // Skipping the extra field here
      buf.subarray(h + 30 + n + e, h + 30 + n + e + s) // Content
    ])

    // Set the extra field length to 0 since we removed that
    rec.writeUint16LE(0, 28)

    // Ignore the extra field and file comment at the end of the central dir entry
    const cde = buf.subarray(o, o + 46 + n)
    cde.writeUint16LE(0, 30)
    cde.writeUint16LE(0, 32)

    // Update the offset for the file record header
    cde.writeUint32LE(ro, 42)

    records.push(rec)
    cenDir.push(cde)
    ro += rec.byteLength
    cds += cde.byteLength
    o += 46 + n + m + k
  }

  const eocd = buf.subarray(offEOCD, offEOCD + 22)

  // Update the records counts
  //TODO: Probably not a good idea to always set both of these to the same
  eocd.writeUint16LE(records.length, 8)
  eocd.writeUint16LE(records.length, 10)

  // Update the central dir size and offset
  eocd.writeUint32LE(cds, 12)
  eocd.writeUint32LE(ro, 16)

  // Set the comment length to 0
  eocd.writeUint16LE(0, 20)

  return Buffer.concat(records.concat(cenDir, [eocd]))
}
