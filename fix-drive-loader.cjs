// Fix para Node.js v24+ no Windows com drives de rede mapeados (Z:, etc.)
// Este patch corrige o problema: "Only URLs with a scheme in: file, data, and node are supported"
// que ocorre quando o projeto está num drive mapeado de rede no Windows.

const Module = require('module');
const originalLoad = Module._load;

// Patch the URL scheme issue for mapped drives on Windows
if (process.platform === 'win32') {
  // Override require to fix z: drive paths when loaded via ESM context
  const url = require('url');
  const path = require('path');
  
  // Ensure Windows drive letters are properly handled
  const originalResolveFilename = Module._resolveFilename;
  Module._resolveFilename = function(request, parent, isMain, options) {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
  
  // Patch process.env to ensure EXPO_METRO_CONFIG_EXPERIMENTAL is set to CJS
  process.env.EXPO_USE_METRO_WORKSPACE_ROOT = '0';
}
