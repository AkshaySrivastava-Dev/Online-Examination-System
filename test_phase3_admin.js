import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4192;
const DIST_DIR = path.resolve('dist');

// Static SPA Server
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
console.log(`[Phase 3 E2E] Static Server running at http://127.0.0.1:${PORT}`);

// Launch Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9223',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.chrome-temp-admin-qa'),
  ],
  { stdio: 'ignore' }
);

let webSocketUrl = null;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch('http://127.0.0.1:9223/json/new', { method: 'PUT' });
    const target = await res.json();
    webSocketUrl = target.webSocketDebuggerUrl;
    if (webSocketUrl) break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!webSocketUrl) {
  console.error('[Phase 3 E2E] Failed to connect to Chrome CDP.');
  process.exit(1);
}

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
      console.warn('[Console Error]:', text);
    }
  } else if (msg.method === 'Runtime.exceptionThrown') {
    const text = msg.params.exceptionDetails?.text || 'Unknown exception';
    consoleErrors.push(text);
    console.error('[Console Exception]:', text);
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
  await new Promise((r) => setTimeout(r, 650));
}

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
    console.log(`✅ [Phase 3 PASS]: ${name}`);
    passed++;
  } else {
    console.error(`❌ [Phase 3 FAIL]: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

try {
  console.log('\n--- EXAMPRO PHASE 3 ADMIN SYSTEM QA SUITE ---\n');

  // 1. Log in as Admin
  await navigate('/login');
  await evaluate('localStorage.clear()');
  await navigate('/login');
  await fillInput('input[type="email"]', 'admin@exampro.com');
  await fillInput('input[type="password"]', 'Admin@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1500));

  let currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/admin/dashboard', 'Auth: Admin login redirects to /admin/dashboard');

  // MODULE 1: Admin Dashboard verification
  let hasAnalyticsCards = await evaluate(`
    const text = document.body.innerText.toUpperCase();
    text.includes('TOTAL STUDENTS') &&
    text.includes('EXAMINATIONS') &&
    text.includes('TOTAL ATTEMPTS') &&
    text.includes('AVERAGE SCORE')
  `);
  report(hasAnalyticsCards, 'M1: Dashboard displays all required analytics metric cards');

  let hasCharts = await evaluate(`
    document.querySelectorAll('.recharts-responsive-container').length >= 2
  `);
  report(hasCharts, 'M1: Recharts visual containers (Participation & Score Distribution) rendered');

  let hasActivityFeed = await evaluate(`
    document.body.innerText.includes('Recent Institutional Activity')
  `);
  report(hasActivityFeed, 'M1: Real-time recent institutional activity timeline rendered');

  // MODULE 2: Student Management
  await navigate('/admin/students');
  currentPath = await evaluate('window.location.pathname');
  let hasStudentTable = await evaluate(`document.querySelectorAll('table tbody tr').length > 0`);
  report(currentPath === '/admin/students' && hasStudentTable, 'M2: /admin/students renders student directory');

  // Search student
  await fillInput('input[placeholder*="Search by name"]', 'Alex');
  await new Promise((r) => setTimeout(r, 400));
  let alexVisible = await evaluate(`document.body.innerText.includes('Alex Morgan')`);
  report(alexVisible, 'M2: Search filter successfully isolates student record');

  // Clear search
  await fillInput('input[placeholder*="Search by name"]', '');
  await new Promise((r) => setTimeout(r, 400));

  // Open Student Details Modal
  await evaluate(`document.querySelectorAll('table tbody tr button')[0].click()`);
  await new Promise((r) => setTimeout(r, 400));
  let viewModalOpen = await evaluate(`document.body.innerText.includes('Student Profile & Academic Record')`);
  report(viewModalOpen, 'M2: Student Profile & Academic Record modal opens with statistics');

  // Close modal
  await evaluate(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Close');
    if (closeBtn) closeBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // MODULE 3: Examination Management
  await navigate('/admin/examinations');
  currentPath = await evaluate('window.location.pathname');
  let hasExamTable = await evaluate(`document.querySelectorAll('table tbody tr').length > 0`);
  report(currentPath === '/admin/examinations' && hasExamTable, 'M3: /admin/examinations lists all curriculum examinations');

  // Open Create Exam Modal
  await evaluate(`
    const createBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Create Examination'));
    if (createBtn) createBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 400));

  let createExamModalOpen = await evaluate(`document.body.innerText.includes('Create New Examination')`);
  report(createExamModalOpen, 'M3: Create New Examination modal opens');

  // Create new test
  await fillInput('#input_examination_title', 'Software Architecture & Design Patterns');
  await fillInput('#input_duration_in_minutes', '45');
  await fillInput('#input_total_marks', '50');
  await evaluate(`
    const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Draft Examination');
    if (submitBtn) submitBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 600));

  let newExamCreated = await evaluate(`document.body.innerText.includes('Software Architecture & Design Patterns')`);
  report(newExamCreated, 'M3: New examination successfully drafted in storage');

  // Test Pre-Publish Validation on empty test
  // Try to publish the newly created test (it has 0 questions, so it MUST fail validation)
  await evaluate(`
    const rows = Array.from(document.querySelectorAll('table tbody tr'));
    const targetRow = rows.find(r => r.innerText.includes('Software Architecture & Design Patterns'));
    if (targetRow) {
      const pubBtn = targetRow.querySelector('button[title*="Publish"]');
      if (pubBtn) pubBtn.click();
    }
  `);
  await new Promise((r) => setTimeout(r, 500));

  let validationModalVisible = await evaluate(`document.body.innerText.includes('Pre-Publish Integrity Checklist Failed')`);
  report(validationModalVisible, 'M3: Pre-publish validation blocks publishing test with 0 questions');

  // Dismiss validation modal
  await evaluate(`
    const dismissBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Dismiss');
    if (dismissBtn) dismissBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // MODULE 4: Question Bank
  await navigate('/admin/questions');
  currentPath = await evaluate('window.location.pathname');
  let hasQuestionBank = await evaluate(`document.body.innerText.includes('Question Bank')`);
  report(currentPath === '/admin/questions' && hasQuestionBank, 'M4: /admin/questions renders question bank');

  // Check Immutability notice
  let hasImmutabilityNotice = await evaluate(`document.body.innerText.includes('Result Immutability Guarantee')`);
  report(hasImmutabilityNotice, 'M4: Question Bank highlights result immutability invariant');

  // Select exam_cs_101 which contains seeded questions
  await evaluate(`
    const select = document.querySelector('select');
    select.value = 'exam_cs_101';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  `);
  await new Promise((r) => setTimeout(r, 600));

  // Open Preview Modal on first question
  await evaluate(`
    const previewBtn = document.querySelector('table tbody tr button[title*="preview" i]');
    if (previewBtn) previewBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));
  let previewModalOpen = await evaluate(`document.body.innerText.includes('Student-Facing Question Preview')`);
  report(previewModalOpen, 'M4: Student-view question preview modal opens with option layout');

  // Reveal answer key
  await evaluate(`
    const revealBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Reveal Answer Key'));
    if (revealBtn) revealBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));
  let answerKeyVisible = await evaluate(`document.body.innerText.includes('Correct Answer')`);
  report(answerKeyVisible, 'M4: Answer key and educational rationale toggle works');

  // Close preview
  await evaluate(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Close Preview'));
    if (closeBtn) closeBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // MODULE 5: Results Management
  await navigate('/admin/results');
  currentPath = await evaluate('window.location.pathname');
  let hasResultsTable = await evaluate(`document.querySelectorAll('table tbody tr').length > 0`);
  report(currentPath === '/admin/results' && hasResultsTable, 'M5: /admin/results lists candidate assessment attempts');

  // Inspect first result detail
  await evaluate(`document.querySelectorAll('table tbody tr button')[0].click()`);
  await new Promise((r) => setTimeout(r, 500));
  let resultDetailOpen = await evaluate(`document.body.innerText.includes('Official Examination Evaluation Report')`);
  let hasSnapshotInfo = await evaluate(`
    const text = document.body.innerText;
    text.includes('Candidate') && text.includes('Examination') && text.includes('Question & Answer Breakdown Sheet')
  `);
  report(resultDetailOpen && hasSnapshotInfo, 'M5: Result inspection modal renders immutable snapshot & itemized breakdown');

  // Close result modal
  await evaluate(`
    const closeBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Close Report'));
    if (closeBtn) closeBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 300));

  // MODULE 6: Admin Profile
  await navigate('/admin/profile');
  currentPath = await evaluate('window.location.pathname');
  let hasProfileCard = await evaluate(`document.body.innerText.includes('Administrator Profile')`);
  report(currentPath === '/admin/profile' && hasProfileCard, 'M6: /admin/profile displays administrator credentials & policies');

  // Update profile phone
  await fillInput('input[type="tel"]', '+1 (555) 999-1234');
  await evaluate(`
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save Profile Changes'));
    if (saveBtn) saveBtn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));
  let profileSaved = await evaluate(`
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const admin = users.find(u => u.role === 'admin');
    admin.phone === '+1 (555) 999-1234'
  `);
  report(profileSaved, 'M6: Administrator profile changes persist to storage');

  // MODULE 7: Admin Navigation & Responsive Layout Audit
  const viewports = [
    { width: 1440, height: 900, name: 'Desktop 1440px' },
    { width: 1280, height: 800, name: 'Laptop 1280px' },
    { width: 768, height: 1024, name: 'Tablet 768px' },
    { width: 375, height: 667, name: 'Mobile 375px' },
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.width < 768,
    });
    await new Promise((r) => setTimeout(r, 150));
    await navigate('/admin/dashboard');

    let hasOverflow = await evaluate(`
      document.documentElement.scrollWidth > window.innerWidth ||
      document.body.scrollWidth > window.innerWidth
    `);
    report(!hasOverflow, `M7 ${vp.name}: /admin/dashboard renders without horizontal overflow`);
  }

  // Check console error audit
  report(consoleErrors.length === 0, 'Technical: No unhandled browser console errors during Phase 3 run', consoleErrors.join('; '));

} catch (err) {
  console.error('[Phase 3 Fatal Error]:', err);
  failed++;
} finally {
  console.log(`\n========================================`);
  console.log(`PHASE 3 QA COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  try {
    await send('Browser.close');
  } catch {}
  chromeProcess.kill();
  server.close();

  try {
    fs.rmSync(path.resolve('.chrome-temp-admin-qa'), { recursive: true, force: true });
  } catch {}

  process.exit(failed > 0 ? 1 : 0);
}
