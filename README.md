# minify-zip
Minifies ZIP files by removing some parts that are usually unnecessary:
- Directory records
- Extra fields
- Comments

## ⚠️ Warning! ⚠️
The CLI will modify the ZIP files in place. Back up any important archives before minifying them!

Removing these parts will be fine in most cases, but may break ZIP files that...
- Are larger than 4 GBs
- Have important empty directories
- Are encrypted
- Contain file names with unicode characters
- Store other important information in extra fields or comments

If any of these apply to a ZIP file, minifying it will remove parts that may be essential.

Some tools may require some of these parts for extra functionality. For example, 7-Zip uses the extra fields to store things like the creation date for files, which is not essential, but allows 7-Zip to display the date in the GUI and to add it to the file when extracting.

## Installation
To use the JavaScript API, install the package like most NPM packages:
```bash
npm i minify-zip
```

To use the CLI, install the package globally:
```bash
npm i -g minify-zip
```

## Usage

### CLI
When installed globally, this package adds the `minify-zip` command:
```
minify-zip <file 1> <file 2> ... <file n>
```
This minifies any number of ZIP files in place. Make sure to back up any important files before minifying them.

Example:
```
> minify-zip example.zip
D:\Examples\example.zip
Minify time: 1.136ms
Before:      3578 bytes
After:       3362 bytes (93.96%)
Saved:       216 bytes (6.04%)
```

### JavaScript API
This exports a single synchronous function that takes a Buffer of the ZIP file content and returns a Buffer of the minified ZIP file:
```js
import fs from 'node:fs'
import minify from 'minify-zip'

// Read a file
const file = fs.readFileSync('example.zip')

// Minify it
const minifiedFile = minify(file)

// Write it to a new file
fs.writeFileSync('example_minified.zip', minifiedFile)
```
