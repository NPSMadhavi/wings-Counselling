const fs = require('fs');

const filePath = './apps/admin/src/admin/Pages/CareersAdmin.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replacements to switch from dark theme to light theme
const replacements = [
  // Backgrounds
  { from: /bg-\[\#0B0F19\]/g, to: 'bg-gray-50' },
  { from: /bg-\[\#121827\]/g, to: 'bg-white' },
  { from: /bg-gray-950/g, to: 'bg-gray-50' },
  { from: /bg-gray-900(\/[0-9]+)?/g, to: 'bg-white$1' },
  { from: /bg-gray-800(\/[0-9]+)?/g, to: 'bg-gray-100$1' },
  { from: /hover:bg-gray-800(\/[0-9]+)?/g, to: 'hover:bg-gray-100$1' },
  { from: /hover:bg-gray-700(\/[0-9]+)?/g, to: 'hover:bg-gray-200$1' },
  { from: /bg-blue-900\/20/g, to: 'bg-blue-50' },
  { from: /bg-blue-900\/40/g, to: 'bg-blue-100' },
  { from: /bg-violet-900\/20/g, to: 'bg-violet-50' },
  { from: /bg-violet-900\/40/g, to: 'bg-violet-100' },
  
  // Text colors
  { from: /text-white/g, to: 'text-gray-900' },
  { from: /text-gray-400/g, to: 'text-gray-500' },
  { from: /text-gray-300/g, to: 'text-gray-700' },
  { from: /text-gray-200/g, to: 'text-gray-800' },
  { from: /hover:text-white/g, to: 'hover:text-gray-900' },
  
  // Borders
  { from: /border-gray-800(\/[0-9]+)?/g, to: 'border-gray-200$1' },
  { from: /border-gray-700(\/[0-9]+)?/g, to: 'border-gray-300$1' },
  
  // Dividing lines
  { from: /divide-gray-800/g, to: 'divide-gray-200' },
  { from: /divide-gray-700/g, to: 'divide-gray-300' },
  
  // Glassmorphism specific borders/backgrounds that are dark
  { from: /border-white\/10/g, to: 'border-gray-200' },
  { from: /border-white\/5/g, to: 'border-gray-100' },
  { from: /bg-white\/5/g, to: 'bg-white' },
  { from: /bg-white\/10/g, to: 'bg-gray-50' },
  
  // Ring colors for focus
  { from: /ring-gray-700/g, to: 'ring-gray-300' },
  { from: /ring-gray-800/g, to: 'ring-gray-200' },
  
  // Shadows (dark shadows usually need to be lighter)
  // Tailwind default shadows work fine on light mode.
];

replacements.forEach(r => {
  content = content.replace(r.from, r.to);
});

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully applied light theme to CareersAdmin.tsx');
