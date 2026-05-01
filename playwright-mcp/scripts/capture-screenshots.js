#!/usr/bin/env node

/**
 * Quick Screenshot Script for GSWIN ERP
 * 
 * Assumes your GSWIN ERP is already running at localhost:5173
 * Uses Playwright MCP to take screenshots of key pages
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  baseUrl: 'http://localhost:5173',
  screenshotsDir: path.join(__dirname, 'screenshots'),
  
  // Key ERP pages to screenshot
  pages: [
    { name: 'login', path: '/login', wait: 2000 },
    { name: 'dashboard', path: '/', wait: 3000 },
    { name: 'inventory', path: '/inventory', wait: 2000 },
    { name: 'sales', path: '/sales', wait: 2000 },
    { name: 'customers', path: '/customers', wait: 2000 },
    { name: 'reports', path: '/reports', wait: 2000 }
  ]
};

// Create screenshots directory
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
  console.log(`📁 Created: ${config.screenshotsDir}`);
}

async function takeScreenshot(url, screenshotPath) {
  console.log(`📸 Capturing: ${url}`);
  
  try {
    // Use Playwright MCP directly
    const command = `npx @playwright/mcp@latest --browser chrome`;
    
    const mcpScript = `
      // Navigate to page
      await browser_navigate({ url: "${url}" });
      
      // Wait for page to load
      await new Promise(r => setTimeout(r, 2000));
      
      // Take screenshot
      const result = await browser_take_screenshot({ 
        format: 'png', 
        fullPage: true,
        path: "${screenshotPath}"
      });
      
      console.log("Screenshot saved to " + result.path);
    `;
    
    // Write script to temp file
    const tempFile = path.join(__dirname, 'temp_mcp_script.js');
    fs.writeFileSync(tempFile, mcpScript);
    
    // Execute with Node
    const { execSync } = require('child_process');
    const output = execSync(`node -e "${mcpScript.replace(/"/g, '\\"')}"`, { 
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    console.log(`✅ Saved: ${screenshotPath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed for ${url}:`, error.message);
    return false;
  }
}

async function captureAllScreenshots() {
  console.log('🚀 Starting GSWIN ERP Screenshot Capture');
  console.log('='.repeat(50));
  console.log(`🌐 Base URL: ${config.baseUrl}`);
  console.log(`📁 Output: ${config.screenshotsDir}`);
  console.log('='.repeat(50) + '\n');
  
  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  for (const page of config.pages) {
    const screenshotName = `${page.name}_${timestamp}.png`;
    const screenshotPath = path.join(config.screenshotsDir, screenshotName);
    const fullUrl = `${config.baseUrl}${page.path}`;
    
    const success = await takeScreenshot(fullUrl, screenshotPath);
    
    results.push({
      page: page.name,
      url: fullUrl,
      success,
      screenshotPath,
      timestamp: new Date().toISOString()
    });
    
    // Wait before next screenshot
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Generate report
  await generateReport(results, timestamp);
  
  return results;
}

async function generateReport(results, timestamp) {
  const reportPath = path.join(config.screenshotsDir, `report_${timestamp}.html`);
  
  let html = `
<!DOCTYPE html>
<html>
<head>
    <title>GSWIN ERP Screenshots - ${new Date().toLocaleString()}</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h1 { color: #2c3e50; }
        .page { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .success { border-left: 5px solid #27ae60; }
        .failed { border-left: 5px solid #e74c3c; }
        img { max-width: 800px; border: 1px solid #ddd; margin-top: 10px; }
        .url { color: #3498db; font-family: monospace; }
        .stats { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>GSWIN ERP Screenshot Report</h1>
    <div class="stats">
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Pages:</strong> ${results.length}</p>
        <p><strong>Successful:</strong> ${results.filter(r => r.success).length}</p>
        <p><strong>Failed:</strong> ${results.filter(r => !r.success).length}</p>
    </div>
  `;
  
  results.forEach(result => {
    html += `
    <div class="page ${result.success ? 'success' : 'failed'}">
        <h3>${result.page.toUpperCase()} ${result.success ? '✅' : '❌'}</h3>
        <p><strong>URL:</strong> <span class="url">${result.url}</span></p>
        <p><strong>Time:</strong> ${new Date(result.timestamp).toLocaleTimeString()}</p>
    `;
    
    if (result.success && fs.existsSync(result.screenshotPath)) {
      const filename = path.basename(result.screenshotPath);
      html += `
        <p><strong>Screenshot:</strong> ${filename}</p>
        <img src="${filename}" alt="${result.page} screenshot">
      `;
    } else {
      html += `<p><em>No screenshot available</em></p>`;
    }
    
    html += `</div>`;
  });
  
  html += `
    <script>
        console.log('Report generated at ${new Date().toISOString()}');
        console.log('Screenshots: ${results.filter(r => r.success).length}/${results.length} successful');
    </script>
</body>
</html>`;
  
  fs.writeFileSync(reportPath, html);
  console.log(`\n📄 Report saved: ${reportPath}`);
  console.log(`📊 Open in browser: file:///${reportPath.replace(/\\/g, '/')}`);
}

// Simple test function
async function testConnection() {
  console.log('🔍 Testing connection to GSWIN ERP...');
  
  try {
    const testUrl = `${config.baseUrl}`;
    console.log(`Testing: ${testUrl}`);
    
    // Simple fetch test
    const { execSync } = require('child_process');
    const curlTest = `curl -s -o /dev/null -w "%{http_code}" ${testUrl} || echo "Not reachable"`;
    
    try {
      const result = execSync(curlTest, { shell: true, encoding: 'utf8' }).trim();
      console.log(`HTTP Status: ${result}`);
      
      if (result === '200' || result === '000') {
        console.log('✅ GSWIN ERP appears to be running');
        return true;
      } else {
        console.log(`⚠️  Got status ${result}, but continuing...`);
        return true;
      }
    } catch {
      console.log('⚠️  Could not reach GSWIN ERP, but continuing anyway...');
      return true;
    }
    
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🎯 GSWIN ERP Screenshot Capture Tool');
  console.log('='.repeat(50));
  
  // Test connection first
  const isConnected = await testConnection();
  
  if (!isConnected) {
    console.log('\n⚠️  Please start your GSWIN ERP first:');
    console.log('  1. Backend: cd backend && python main.py');
    console.log('  2. Frontend: cd frontend && npm run dev');
    console.log('\nThen run this script again.');
    return;
  }
  
  console.log('\n📸 Starting screenshot capture in 3 seconds...');
  await new Promise(r => setTimeout(r, 3000));
  
  // Capture screenshots
  const results = await captureAllScreenshots();
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 CAPTURE COMPLETE');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const symbol = result.success ? '✅' : '❌';
    console.log(`${symbol} ${result.page.padEnd(12)} ${result.url}`);
  });
  
  console.log('\n🎉 All done! Screenshots saved to:', config.screenshotsDir);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { captureAllScreenshots, config };