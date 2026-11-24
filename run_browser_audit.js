import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4188;
const DIST_DIR = path.resolve('dist');

// 1. Static SPA Server
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }
  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500);
    res.end('Error loading ' + req.url);
  }
});

await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[E2E] Static Server running at http://127.0.0.1:${PORT}`);

// 2. Launch Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.chrome-temp-qa'),
  ],
  { stdio: 'ignore' }
);

// Wait for Chrome CDP to be available
let webSocketUrl = null;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/new', { method: 'PUT' });
    const target = await res.json();
    webSocketUrl = target.webSocketDebuggerUrl;
    if (webSocketUrl) break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!webSocketUrl) {
  console.error('[E2E] Failed to connect to Chrome CDP.');
  process.exit(1);
}

console.log('[E2E] Connected to Chrome CDP target:', webSocketUrl);

// 3. Setup WebSocket connection for CDP
const ws = new WebSocket(webSocketUrl);
let id = 1;
const pending = new Map();
const consoleErrors = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    if (msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || a.description).join(' ');
      consoleErrors.push(text);
      console.warn('[Browser Console Error]:', text);
    }
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const text = msg.params.exceptionDetails?.text || 'Unknown exception';
    consoleErrors.push(text);
    console.error('[Browser Exception]:', text);
  }
};

await new Promise((resolve) => {
  ws.onopen = resolve;
});

function send(method, params = {}) {
  const callId = id++;
  return new Promise((resolve, reject) => {
    pending.set(callId, { resolve, reject });
    ws.send(JSON.stringify({ id: callId, method, params }));
  });
}

// Enable Page, Runtime, DOM
await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');

async function evaluate(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.value;
}

async function navigate(path) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${path}` });
  await new Promise((r) => setTimeout(r, 600)); // wait for hydration and render
}

async function setViewport(width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await new Promise((r) => setTimeout(r, 150));
}

// React synthetic input setter
async function fillInput(selector, value) {
  await evaluate(`
    (() => {
      const el = document.querySelector('${selector}');
      if (!el) return;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    })()
  `);
}

let passed = 0;
let failed = 0;

function report(condition, name, details = '') {
  if (condition) {
    console.log(`✅ [Browser QA PASS]: ${name}`);
    passed++;
  } else {
    console.error(`❌ [Browser QA FAIL]: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

try {
  console.log('\n--- EXAMPRO PHASE 2 BROWSER-LEVEL QA SUITE ---\n');

  // Test 1: Open /login
  await navigate('/login');
  await evaluate('localStorage.clear()');
  await navigate('/login');
  let currentPath = await evaluate('window.location.pathname');
  let hasLoginForm = await evaluate('!!document.querySelector("form")');
  report(currentPath === '/login' && hasLoginForm, 'Step 1: Open /login renders login form');

  // Test 2 & 3: Admin Login and Redirection using Quick-Fill or synthetic fill
  await fillInput('input[type="email"]', 'admin@exampro.com');
  await fillInput('input[type="password"]', 'Admin@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  let adminBadge = await evaluate('document.body.innerText.includes("Admin") || document.body.innerText.includes("Dashboard")');
  report(currentPath === '/admin/dashboard' && adminBadge, 'Step 2 & 3: Admin login routes to /admin/dashboard');

  // Test 4: Logout
  await evaluate(`
    const signOutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out') || b.getAttribute('title') === 'Sign out');
    if (signOutBtn) signOutBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));
  currentPath = await evaluate('window.location.pathname');
  let sessionCleared = await evaluate('!localStorage.getItem("exampro_v1_current_session")');
  report(currentPath === '/login' && sessionCleared, 'Step 4: Logout routes to /login and purges session');

  // Test 5 & 6: Student Login and Redirection
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  let studentBadge = await evaluate('document.body.innerText.includes("Student Portal") || document.body.innerText.includes("Alex Morgan")');
  let studentIdVisible = await evaluate('document.body.innerText.includes("STD-2026-001")');
  report(currentPath === '/student/dashboard' && studentBadge && studentIdVisible, 'Step 5 & 6: Student login routes to /student/dashboard');

  // Test 7: Student attempts to access /admin/dashboard -> deflected to /student/dashboard
  await navigate('/admin/dashboard');
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/student/dashboard', 'Step 7: Student accessing /admin/dashboard is deflected to /student/dashboard');

  // Logout student
  await evaluate(`
    const signOutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out') || b.getAttribute('title') === 'Sign out');
    if (signOutBtn) signOutBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Admin login again to test Admin accessing /student/dashboard
  await fillInput('input[type="email"]', 'admin@exampro.com');
  await fillInput('input[type="password"]', 'Admin@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));

  // Test 8: Admin attempts to access /student/dashboard -> deflected to /admin/dashboard
  await navigate('/student/dashboard');
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/admin/dashboard', 'Step 8: Admin accessing /student/dashboard is deflected to /admin/dashboard');

  // Test 9: Refresh browser while logged in
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  adminBadge = await evaluate('document.body.innerText.includes("Admin") || document.body.innerText.includes("Overview")');
  report(currentPath === '/admin/dashboard' && adminBadge, 'Step 9: Refresh preserves active session at /admin/dashboard');

  // Logout admin
  await evaluate(`
    const signOutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out') || b.getAttribute('title') === 'Sign out');
    if (signOutBtn) signOutBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Test 10: Multi-tab session synchronization simulation
  await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const admin = users.find(u => u.role === 'admin');
    const mockSess = { user: admin, sessionId: 'sess_tab_sync', lastActive: Date.now() };
    localStorage.setItem('exampro_v1_current_session', JSON.stringify(mockSess));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'exampro_v1_current_session',
      newValue: JSON.stringify(mockSess)
    }));
  `);
  await new Promise((r) => setTimeout(r, 600));
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/admin/dashboard', 'Step 10: Cross-tab login storage event triggers automatic synchronization');

  // Simulate cross-tab logout
  await evaluate(`
    localStorage.removeItem('exampro_v1_current_session');
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'exampro_v1_current_session',
      newValue: null
    }));
  `);
  await new Promise((r) => setTimeout(r, 600));
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Step 10b: Cross-tab logout storage event clears session and redirects to /login');

  // Test 11: Register new student
  await navigate('/signup');
  const testStudentEmail = `qa.student.${Date.now()}@university.edu`;
  await fillInput('#input_full_name', 'Samantha QA Tester');
  await fillInput('#input_institutional_email', testStudentEmail);
  await fillInput('#input_phone_number_optional', '+1 555-8888');
  await fillInput('#input_password', 'TestPass123');
  await fillInput('#input_confirm_password', 'TestPass123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Step 11a: Valid student signup navigates to /login');

  // Login with newly registered student
  await fillInput('input[type="email"]', testStudentEmail);
  await fillInput('input[type="password"]', 'TestPass123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  let newStudentWelcome = await evaluate('document.body.innerText.includes("Samantha QA Tester")');
  report(currentPath === '/student/dashboard' && newStudentWelcome, 'Step 11b: Newly registered student successfully logs in');

  // Logout new student
  await evaluate(`
    const signOutBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Sign Out') || b.getAttribute('title') === 'Sign out');
    if (signOutBtn) signOutBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));

  // Test 12: Duplicate email registration rejection
  await navigate('/signup');
  await fillInput('#input_full_name', 'Duplicate Tester');
  await fillInput('#input_institutional_email', testStudentEmail); // duplicate email
  await fillInput('#input_password', 'TestPass123');
  await fillInput('#input_confirm_password', 'TestPass123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 600));
  currentPath = await evaluate('window.location.pathname');
  let duplicateError = await evaluate('document.body.innerText.includes("already exists")');
  report(currentPath === '/signup' && duplicateError, 'Step 12: Duplicate email registration is blocked with clear error');

  // Test 13: Invalid credentials & form validation
  await navigate('/login');
  // 13a: Empty submission
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 300));
  let emptyError = await evaluate('document.body.innerText.includes("Email address is required")');
  report(emptyError, 'Step 13a: Empty login form triggers required field validation');

  // 13b: Invalid credentials
  await fillInput('input[type="email"]', 'admin@exampro.com');
  await fillInput('input[type="password"]', 'IncorrectPass999');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 600));
  let invalidCredError = await evaluate('document.body.innerText.includes("Invalid email or password")');
  report(invalidCredError, 'Step 13b: Incorrect password produces friendly authentication error');

  // Test 14: 404 Route handling
  await navigate('/some-nonexistent-path-for-testing');
  currentPath = await evaluate('window.location.pathname');
  let is404 = await evaluate('document.body.innerText.includes("Page Not Found (404)")');
  report(is404, 'Step 14: Invalid route renders 404 Not Found page');

  // Test 15: Logged-out access to protected routes is blocked
  await navigate('/admin/dashboard');
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Step 15a: Logged-out direct access to /admin/dashboard redirected to /login');

  await navigate('/student/dashboard');
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Step 15b: Logged-out direct access to /student/dashboard redirected to /login');

  // Section 2: Session and Authorization Testing
  console.log('\n--- SESSION & AUTHORIZATION EDGE CASES ---\n');

  // Suspended user session invalidation
  await navigate('/login');
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));

  // Suspend student account in storage
  await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const idx = users.findIndex(u => u.email === 'alex.morgan@university.edu');
    if (idx !== -1) {
      users[idx].status = 'suspended';
      localStorage.setItem('exampro_v1_users', JSON.stringify(users));
    }
  `);

  // Reload page
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Session Invalidated: Suspended user session is rejected on reload');

  // Deleted user session invalidation
  await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const idx = users.findIndex(u => u.email === 'alex.morgan@university.edu');
    if (idx !== -1) {
      users[idx].status = 'active';
      localStorage.setItem('exampro_v1_users', JSON.stringify(users));
    }
  `);
  await navigate('/login');
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 700));

  // Mark deleted
  await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const idx = users.findIndex(u => u.email === 'alex.morgan@university.edu');
    if (idx !== -1) {
      users[idx].isDeleted = true;
      localStorage.setItem('exampro_v1_users', JSON.stringify(users));
    }
  `);
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 700));
  currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/login', 'Session Invalidated: Soft-deleted user session is rejected on reload');

  // Reset student back to normal
  await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const idx = users.findIndex(u => u.email === 'alex.morgan@university.edu');
    if (idx !== -1) {
      users[idx].isDeleted = false;
      users[idx].status = 'active';
      localStorage.setItem('exampro_v1_users', JSON.stringify(users));
    }
  `);

  // Section 3: UI & Responsiveness Across Viewports
  console.log('\n--- RESPONSIVENESS & OVERFLOW CHECKS ---\n');
  const viewports = [
    { width: 1440, height: 900, name: 'Desktop 1440px' },
    { width: 1280, height: 800, name: 'Laptop 1280px' },
    { width: 768, height: 1024, name: 'Tablet 768px' },
    { width: 375, height: 667, name: 'Mobile 375px' },
  ];

  for (const vp of viewports) {
    await setViewport(vp.width, vp.height);
    await navigate('/login');
    let hasOverflowLogin = await evaluate(`
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth
    `);
    report(!hasOverflowLogin, `${vp.name}: /login renders without horizontal overflow`);

    await navigate('/signup');
    let hasOverflowSignup = await evaluate(`
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth
    `);
    report(!hasOverflowSignup, `${vp.name}: /signup renders without horizontal overflow`);
  }

  // Password visibility toggle test
  await navigate('/login');
  await new Promise((r) => setTimeout(r, 400));
  let initialType = await evaluate(`document.querySelector('input[placeholder="••••••••••••"]')?.type`);
  await evaluate(`document.querySelector('button[aria-label="Show password"]')?.click()`);
  await new Promise((r) => setTimeout(r, 400));
  let toggledType = await evaluate(`document.querySelector('input[placeholder="••••••••••••"]')?.type`);
  report(initialType === 'password' && toggledType === 'text', 'Password Visibility Toggle switches between password and text');

  // Check console errors
  console.log('\n--- CONSOLE ERROR AUDIT ---\n');
  report(consoleErrors.length === 0, 'No unhandled browser console errors or exceptions', consoleErrors.join('; '));

} catch (err) {
  console.error('[E2E Fatal Error]:', err);
  failed++;
} finally {
  console.log(`\n========================================`);
  console.log(`BROWSER QA COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  try {
    await send('Browser.close');
  } catch {}
  chromeProcess.kill();
  server.close();

  // Clean temp dir
  try {
    fs.rmSync(path.resolve('.chrome-temp-qa'), { recursive: true, force: true });
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}
