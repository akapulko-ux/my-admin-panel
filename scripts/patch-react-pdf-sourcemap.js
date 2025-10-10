// Removes invalid sourceMappingURL from @react-pdf/renderer to silence source-map-loader warnings
const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const original = fs.readFileSync(filePath, 'utf8');
    const patched = original.replace(/\n\s*\/\/\#\s*sourceMappingURL=react-pdf\.browser\.js\.map\s*$/m, '\n');
    if (patched !== original) {
      fs.writeFileSync(filePath, patched, 'utf8');
      return true;
    }
    return false;
  } catch (e) {
    console.error('patch-react-pdf-sourcemap error:', e.message);
    return false;
  }
}

const target = path.join(__dirname, '..', 'node_modules', '@react-pdf', 'renderer', 'lib', 'react-pdf.browser.js');
const changed = patchFile(target);
if (changed) {
  console.log('[patch-react-pdf-sourcemap] Patched', target);
} else {
  console.log('[patch-react-pdf-sourcemap] Nothing to patch or already patched');
}


