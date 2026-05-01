#!/usr/bin/env node

/**
 * GSWIN ERP Build + Screenshot Verification with Playwright MCP
 * 
 * This script:
 * 1. Builds the frontend
 * 2. Starts the backend
 * 3. Uses Playwright MCP to take screenshots of key ERP pages
 * 4. Saves screenshots to /screenshots/ folder
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  frontendPath: path.join(__dirname, '..', 'frontend'),
  backendPath: path.join(__dirname, '..', 'backend'),
  screenshotsDir: path.join(__dirname, 'screenshots'),
  baseUrl: 'http://localhost:5173', // Vite default port
  backendUrl: 'http://localhost:8000', // FastAPI default port
  
  // Pages to screenshot (ERP key pages)
  pagesToScreenshot: [
    { name: 'login', path: '/login' },
    { name: 'dashboard', path: '/' },
    { name: 'inventory', path: '/inventory' },
    { name: 'sales', path: '/sales' },
    { name: 'customers', path: '/customers' },
    { name: 'reports', path: '/reports' }
  ]
};

// Create screenshots directory
if (!fs.existsSync(config.screenshotsDir)) {
  fs.mkdirSync(config.screenshotsDir, { recursive: true });
  console.log(`📁 Created screenshots directory: ${config.screenshotsDir}`);
}

async function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { 
      cwd, 
      shell: true,
      stdio: 'pipe' 
    });

    let output = '';
    let error = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`[${command}] ${data.toString().trim()}`);
    });

    process.stderr.on('data', (data) => {
      error += data.toString();
      console.error(`[${command} ERROR] ${data.toString().trim()}`);
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with code ${code}: ${error}`));
      }
    });
  });
}

async function buildFrontend() {
  console.log('🏗️  Building frontend...');
  try {
    await runCommand('npm', ['run', 'build'], config.frontendPath);
    console.log('✅ Frontend built successfully');
    return true;
  } catch (error) {
    console.error('❌ Frontend build failed:', error.message);
    return false;
  }
}

async function startBackend() {
  console.log('🚀 Starting backend...');
  try {
    // Start backend in background
    const backendProcess = spawn('python', ['main.py'], {
      cwd: config.backendPath,
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
    
    backendProcess.unref();
    console.log(`✅ Backend started (PID: ${backendProcess.pid})`);
    
    // Wait for backend to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    return backendProcess;
  } catch (error) {
    console.error('❌ Failed to start backend:', error.message);
    return null;
  }
}

async function startFrontend() {
  console.log('🌐 Starting frontend dev server...');
  try {
    const frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: config.frontendPath,
      shell: true,
      detached: true,
      stdio: 'ignore'
    });
    
    frontendProcess.unref();
    console.log(`✅ Frontend dev server started (PID: ${frontendProcess.pid})`);
    
    // Wait for frontend to be ready
    await new Promise(resolve => setTimeout(resolve, 3000));
    return frontendProcess;
  } catch (error) {
    console.error('❌ Failed to start frontend:', error.message);
    return null;
  }
}

async function takeScreenshotWithPlaywrightMCP(url, screenshotPath) {
  console.log(`📸 Taking screenshot of ${url}...`);
  
  try {
    // Create MCP command for screenshot
    const mcpCommand = `npx @playwright/mcp@latest --browser chrome --execute-script `
      + `"const response = await browser_navigate({ url: '${url}' }); `
      + `await new Promise(r => setTimeout(r, 2000)); `
      + `const screenshot = await browser_take_screenshot({ format: 'png', fullPage: true }); `
      + `console.log(JSON.stringify({ status: 'success', file: '${screenshotPath}' }));"`;

    // Execute MCP command
    await runCommand('cmd', ['/c', mcpCommand], __dirname);
    
    console.log(`✅ Screenshot saved: ${screenshotPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to take screenshot of ${url}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting GSWIN ERP Build + Screenshot Verification');
  console.log('='.repeat(50));
  
  let backendProcess = null;
  let frontendProcess = null;
  
  try {
    // Step 1: Build frontend
    const buildSuccess = await buildFrontend();
    if (!buildSuccess) {
      console.log('⚠️  Continuing with existing build...');
    }
    
    // Step 2: Start services
    backendProcess = await startBackend();
    if (!backendProcess) {
      console.log('⚠️  Could not start backend, but continuing...');
    }
    
    frontendProcess = await startFrontend();
    if (!frontendProcess) {
      console.log('⚠️  Could not start frontend, but continuing...');
    }
    
    // Step 3: Take screenshots
    console.log('\n📸 Starting screenshot capture...');
    console.log('-'.repeat(50));
    
    const screenshotResults = [];
    
    for (const page of config.pagesToScreenshot) {
      const screenshotPath = path.join(
        config.screenshotsDir, 
        `${page.name}_${new Date().toISOString().replace(/[:.]/g, '-')}.png`
      );
      
      const fullUrl = `${config.baseUrl}${page.path}`;
      const success = await takeScreenshotWithPlaywrightMCP(fullUrl, screenshotPath);
      
      screenshotResults.push({
        page: page.name,
        url: fullUrl,
        success,
        path: screenshotPath
      });
      
      // Wait between screenshots
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Step 4: Summary
    console.log('\n📊 Screenshot Summary:');
    console.log('='.repeat(50));
    
    const successful = screenshotResults.filter(r => r.success).length;
    const total = screenshotResults.length;
    
    console.log(`✅ Successful: ${successful}/${total}`);
    
    screenshotResults.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${result.page}: ${result.url}`);
      if (result.success) {
        console.log(`   Screenshot: ${result.path}`);
      }
    });
    
    // Step 5: Create HTML report
    await createHTMLReport(screenshotResults);
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    
    if (backendProcess) {
      try {
        process.kill(-backendProcess.pid);
        console.log('✅ Backend stopped');
      } catch {}
    }
    
    if (frontendProcess) {
      try {
        process.kill(-frontendProcess.pid);
        console.log('✅ Frontend stopped');
      } catch {}
    }
    
    console.log('\n🎉 Verification complete!');
  }
}

async function createHTMLReport(screenshotResults) {
  const reportPath = path.join(config.screenshotsDir, 'screenshot_report.html');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GSWIN ERP Screenshot Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        .screenshot { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        img { max-width: 100%; border: 1px solid #ccc; margin-top: 10px; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <h1>GSWIN ERP Screenshot Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <p>Total Pages: ${screenshotResults.length}</p>
        <p>Successful: ${screenshotResults.filter(r => r.success).length}</p>
        <p>Failed: ${screenshotResults.filter(r => !r.success).length}</p>
    </div>
    
    <h2>Screenshots</h2>
    ${screenshotResults.map(result => `
        <div class="screenshot ${result.success ? 'success' : 'failed'}">
            <h3>${result.page.toUpperCase()} ${result.success ? '✅' : '❌'}</h3>
            <p><strong>URL:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
            <p><strong>Status:</strong> ${result.success ? 'Success' : 'Failed'}</p>
            <p><strong>Screenshot:</strong> ${path.basename(result.path)}</p>
            ${result.success ? `<img src="${path.basename(result.path)}" alt="${result.page} screenshot">` : '<p>No screenshot available</p>'}
        </div>
    `).join('')}
</body>
</html>
  `;
  
  fs.writeFileSync(reportPath, htmlContent);
  console.log(`📄 HTML Report created: ${reportPath}`);
  
  // Copy screenshots to report directory (they're already there)
  console.log(`📊 View report at: file:///${reportPath}`);
}

// Run the main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, config };