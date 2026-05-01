const fs = require('fs');
const path = require('path');

// Check if index.html exists in frontend directory
if (!fs.existsSync(path.join(__dirname, 'index.html'))) {
  // Copy from frontend directory to the current directory
  const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'index.html'), indexHtml);
  console.log('Successfully copied index.html to the correct location.');
} else {
  console.log('index.html already exists in the current directory.');
}