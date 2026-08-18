const fs = require('fs');
const files = [
  { name: 'beep-logo.png', varName: 'beepLogoBase64', mime: 'image/png' },
  { name: 'radio-hero.jpg', varName: 'radioHeroBase64', mime: 'image/jpeg' }
];

let output = '';

files.forEach(f => {
  try {
    const path = `d:/CLIENTES/BeepApp/Projeto/src/assets/${f.name}`;
    if (fs.existsSync(path)) {
      const b = fs.readFileSync(path);
      output += `export const ${f.varName} = 'data:${f.mime};base64,${b.toString('base64')}';\n`;
    }
  } catch (e) {
    console.error(e);
  }
});

fs.writeFileSync('d:/CLIENTES/BeepApp/Projeto/AppMobile/constants/logos.ts', output);
console.log('Base64 logos generated!');
