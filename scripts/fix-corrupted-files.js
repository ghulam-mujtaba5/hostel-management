const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/layout.tsx',
  'src/components/LoadingButton.tsx',
  'src/components/Logo.tsx',
  'src/components/ui/label.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Replace \" with "
    content = content.replace(/\\"/g, '"');
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
