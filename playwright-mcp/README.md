# Playwright MCP Automation for GSWIN ERP

## Overview
This directory contains Playwright MCP automation scripts for the GSWIN ERP system. 
Using Playwright MCP, you can automate browser interactions, perform E2E testing, 
and create automated workflows for ERP operations.

## Capabilities

### 1. **Automated Testing**
- E2E tests for critical ERP workflows
- User authentication and authorization flows
- Database operation verifications
- Form validation and data submission

### 2. **Business Process Automation**
- Inventory management workflows
- Sales order processing
- Invoice generation and tracking
- Report generation and export
- Data import/export automation

### 3. **Monitoring & Alerts**
- Dashboard monitoring
- System health checks
- Performance monitoring
- Error detection and reporting

## Directory Structure
```
playwright-mcp/
├── package.json
├── README.md
├── mcp-config.json           # MCP server configuration
├── .env.example              # Environment variables
├── scripts/                  # Automation scripts
│   ├── automate-inventory.js
│   ├── automate-orders.js
│   ├── automate-reports.js
│   └── admin-dashboard.js
├── tests/                    # E2E tests
│   ├── authentication.spec.js
│   ├── inventory.spec.js
│   ├── orders.spec.js
│   └── reports.spec.js
├── workflows/                # Business workflows
│   ├── inventory-workflow.js
│   ├── sales-workflow.js
│   └── procurement-workflow.js
└── utils/                    # Utilities
    ├── auth.js
    ├── navigation.js
    ├── data-helpers.js
    └── reporting.js
```

## Setup

1. **Install dependencies:**
   ```bash
   cd playwright-mcp
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your ERP credentials
   ```

3. **Start MCP server:**
   ```bash
   npm run start-mcp
   ```

4. **Run automation:**
   ```bash
   npm run automate:inventory
   # or
   npx playwright test
   ```

## ERP Automation Examples

### Inventory Management
```javascript
// Navigate to inventory, check stock levels, create purchase orders
await automateInventory({
  minStockLevel: 10,
  autoReorder: true,
  supplierPreference: "main"
});
```

### Sales Order Processing
```javascript
// Process new orders, generate invoices, update inventory
await processSalesOrder({
  orderId: "ORD-12345",
  autoInvoice: true,
  updateInventory: true,
  notifyCustomer: true
});
```

### Report Generation
```javascript
// Generate monthly sales report and export to CSV
await generateMonthlyReport({
  month: "April",
  year: 2026,
  format: "csv",
  emailRecipients: ["manager@company.com"]
});
```

## MCP Tools Available

Playwright MCP provides 40+ tools including:
- `browser_navigate` - Navigate to ERP URLs
- `browser_snapshot` - Get accessibility tree for ERP pages
- `browser_click` - Click buttons, menu items
- `browser_type` - Fill forms, search fields
- `browser_fill_form` - Multi-field form completion
- `browser_take_screenshot` - Capture ERP screens
- `browser_wait_for` - Wait for async operations
- `browser_cookie_list/get/set` - Manage ERP session
- `browser_localstorage` - Access ERP local data

## Security Notes
- Never hardcode credentials in scripts
- Use environment variables for sensitive data
- Implement proper error handling
- Add timeout limits for long-running automations
- Log all automation activities

## Integration with Existing ERP
The scripts are designed to work with your existing GSWIN ERP system at:
- Frontend: React + Vite + TanStack Query
- Backend: FastAPI + SQLAlchemy
- Database: PostgreSQL (with legacy GSWIN migration)

## Customization
Edit the scripts in `/workflows/` to match your specific ERP business processes.
Add new test cases in `/tests/` for additional quality assurance.