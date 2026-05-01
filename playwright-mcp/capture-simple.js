const { chromium } = require('playwright');

const PAGES = [
  { name: 'login', url: 'http://localhost:5174/login' },
  { name: 'dashboard', url: 'http://localhost:5174/' },
  { name: 'inventory', url: 'http://localhost:5174/inventory' },
  { name: 'sales', url: 'http://localhost:5174/sales' },
  { name: 'customers', url: 'http://localhost:5174/customers' },
  { name: 'reports', url: 'http://localhost:5174/reports' },
];

const SCREENSHOTS_DIR = 'C:\\Users\\hi\\gswin-erp\\playwright-mcp\\screenshots';

async function captureScreenshots() {
  console.log('🚀 Starting GSWIN ERP Screenshot Capture');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const p of PAGES) {
    const filename = `${p.name}_${Date.now()}.png`;
    const filepath = `${SCREENSHOTS_DIR}\\${filename}`;

    console.log(`📸 Capturing: ${p.url}`);

    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: filepath, fullPage: true });

      console.log(`✅ Saved: ${filename}`);
      results.push({ name: p.name, url: p.url, success: true, filename });
    } catch (error) {
      console.error(`❌ Failed: ${error.message}`);
      results.push({ name: p.name, url: p.url, success: false, error: error.message });
    }
  }

  await browser.close();

  // Generate report
  const reportPath = `${SCREENSHOTS_DIR}\\report_${Date.now()}.html`;
  const fs = require('fs');
  const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>GSWIN ERP Screenshots</title>
  <style>
    body { font-family: sans-serif; margin: 20px; }
    .page { margin: 15px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .success { border-left: 4px solid #27ae60; }
    .failed { border-left: 4px solid #e74c3c; }
    img { max-width: 100%; border: 1px solid #ccc; margin-top: 10px; }
  </style>
</head>
<body>
  <h1>GSWIN ERP Screenshot Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  ${results.map(r => `
    <div class="page ${r.success ? 'success' : 'failed'}">
      <h3>${r.name.toUpperCase()} ${r.success ? '✅' : '❌'}</h3>
      <p><strong>URL:</strong> <a href="${r.url}">${r.url}</a></p>
      ${r.success ? `<img src="${r.filename}">` : `<p>Error: ${r.error}</p>`}
    </div>
  `).join('')}
</body>
</html>`;

  fs.writeFileSync(reportPath, reportHtml);

  console.log('\n📊 Summary:');
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.name}`);
  });

  console.log(`\n📄 Report: file:///${reportPath.replace(/\\/g, '/')}`);
}

captureScreenshots().catch(console.error);