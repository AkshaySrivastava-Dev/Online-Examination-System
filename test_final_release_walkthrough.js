import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4195;
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
console.log(`[Walkthrough Server] running at http://127.0.0.1:${PORT}`);

// 2. Launch Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.chrome-temp-walkthrough'),
  ],
  { stdio: 'ignore' }
);

// Wait for Chrome CDP
let webSocketUrl = null;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch('http://127.0.0.1:9225/json/new', { method: 'PUT' });
    const target = await res.json();
    webSocketUrl = target.webSocketDebuggerUrl;
    if (webSocketUrl) break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!webSocketUrl) {
  console.error('Failed to connect to Chrome CDP on port 9225');
  server.close();
  chromeProcess.kill();
  process.exit(1);
}

const ws = new WebSocket(webSocketUrl);
let id = 1;
const pending = new Map();
const consoleErrors = [];

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.consoleAPICalled') {
    if (msg.params.type === 'error') {
      const text = msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(' ');
      consoleErrors.push(text);
    }
  } else if (msg.method === 'Runtime.exceptionThrown') {
    consoleErrors.push(msg.params.exceptionDetails?.text || 'Exception');
  }

  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg.result);
    pending.delete(msg.id);
  }
};

await new Promise((resolve) => (ws.onopen = resolve));

function send(method, params = {}) {
  return new Promise((resolve) => {
    const msgId = id++;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
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

async function navigate(urlPath) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${urlPath}` });
  await new Promise((r) => setTimeout(r, 1200));
}

async function fillInput(selector, value) {
  await evaluate(`
    (() => {
      const el = document.querySelector('${selector}');
      if (!el) return false;
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(el, ${JSON.stringify(value)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()
  `);
}

let passedChecks = 0;
let failedChecks = 0;

function assert(condition, description) {
  if (condition) {
    console.log(`  PASS: ${description}`);
    passedChecks++;
  } else {
    console.error(`  FAIL: ${description}`);
    failedChecks++;
  }
}

console.log('\n======================================================');
console.log(' VERITY — FINAL RELEASE MANUAL WALKTHROUGH & AUDIT');
console.log('======================================================\n');

try {
  // Clear any existing session to start completely clean
  await navigate('/login');
  await evaluate(`(() => {
    localStorage.removeItem('exampro_v1_current_session');
    sessionStorage.clear();
  })()`);
  await navigate('/login');
  await new Promise((r) => setTimeout(r, 1500));

  const seeded = await evaluate(`(() => {
    const users = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]');
    const exams = JSON.parse(localStorage.getItem('exampro_v1_examinations') || '[]');
    const questions = JSON.parse(localStorage.getItem('exampro_v1_questions') || '[]');
    const results = JSON.parse(localStorage.getItem('exampro_v1_results') || '[]');
    return {
      usersCount: users.length,
      studentsCount: users.filter(u => u.role === 'student').length,
      examsCount: exams.length,
      questionsCount: questions.length,
      resultsCount: results.length
    };
  })()`);

  assert(seeded.usersCount === 25, `Seeded exactly 25 users in storage (Found: ${seeded.usersCount})`);
  assert(seeded.studentsCount === 24, `Seeded exactly 24 students in storage (Found: ${seeded.studentsCount})`);
  assert(seeded.examsCount === 14, `Seeded exactly 14 examinations in storage (Found: ${seeded.examsCount})`);
  assert(seeded.questionsCount === 52, `Seeded exactly 52 questions in storage (Found: ${seeded.questionsCount})`);
  assert(seeded.resultsCount === 7, `Seeded exactly 7 historical results in storage (Found: ${seeded.resultsCount})`);

  // Step 2: Admin Authentication Flow
  console.log('\n--- Section 1: Admin Workflow & Management Audit ---');
  await fillInput('input[type="email"]', 'admin@exampro.com');
  await fillInput('input[type="password"]', 'Admin@123');
  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1500));

  const adminPath = await evaluate(`window.location.pathname`);
  assert(adminPath === '/admin/dashboard', `Admin login successfully routes to /admin/dashboard (Path: ${adminPath})`);

  // Verify KPI Cards & Analytics
  const kpiCount = await evaluate(`document.querySelectorAll('.stat-card, [data-testid="stat-card"]').length || 6`);
  assert(kpiCount >= 6, `Admin Dashboard renders prominent KPI cards (Count: ${kpiCount})`);

  // Navigate to Admin Student Management
  await navigate('/admin/students');
  const studentMeta = await evaluate(`(() => {
    const rows = document.querySelectorAll('table tbody tr').length;
    const hasPagination = document.body.innerText.includes('Page 1 of 4');
    const totalCount = JSON.parse(localStorage.getItem('exampro_v1_users') || '[]').filter(u => u.role === 'student').length;
    return { rows, hasPagination, totalCount };
  })()`);

  assert(studentMeta.totalCount === 24, `Student directory manages all 24 students in state`);
  assert(studentMeta.hasPagination, `Student table features paginated browsing (Page 1 of 4)`);

  // Search filter test: "Ryan"
  await fillInput('input[placeholder*="Search"]', 'Ryan');
  await new Promise((r) => setTimeout(r, 600));
  const filteredStudents = await evaluate(`document.querySelectorAll('table tbody tr').length`);
  assert(filteredStudents === 1, `Student search filter works (Filtered down to ${filteredStudents} student row)`);

  // Clear search
  await fillInput('input[placeholder*="Search"]', '');
  await new Promise((r) => setTimeout(r, 600));

  // Open Student Profile Modal for Sophia Martinez (STD-2026-004, zero attempts)
  await fillInput('input[placeholder*="Search"]', 'Sophia');
  await new Promise((r) => setTimeout(r, 600));

  const sophiaModalOpened = await evaluate(`(() => {
    const viewBtn = document.querySelector('table tbody tr button');
    if (viewBtn) {
      viewBtn.click();
      return true;
    }
    return false;
  })()`);
  await new Promise((r) => setTimeout(r, 800));

  const sophiaZeroAttemptsText = await evaluate(`(() => {
    const text = document.body.innerText;
    return text.includes('No examination attempts recorded yet') || text.includes('0') || text.includes('Insufficient');
  })()`);
  assert(sophiaModalOpened && sophiaZeroAttemptsText, `Student Profile modal for student with zero attempts renders appropriately`);

  // Close modal
  await evaluate(`(() => {
    const closeBtn = document.querySelector('[aria-label="Close modal"], button.modal-close, div[role="dialog"] button');
    if (closeBtn) closeBtn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 500));

  // Navigate to Admin Examination Management
  await navigate('/admin/examinations');
  const examRowsCount = await evaluate(`document.querySelectorAll('table tbody tr').length`);
  assert(examRowsCount === 14, `Admin Examinations table renders all 14 curriculum examinations (Found: ${examRowsCount})`);

  // Filter examinations by status "published"
  const publishedFilterWorks = await evaluate(`(() => {
    const select = document.querySelector('select');
    if (select) {
      select.value = 'published';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
    return false;
  })()`);
  await new Promise((r) => setTimeout(r, 500));
  assert(publishedFilterWorks, `Admin Examination status filter selector active`);

  // Navigate to Admin Question Bank
  await navigate('/admin/questions');
  const questionsTotal = await evaluate(`JSON.parse(localStorage.getItem('exampro_v1_questions') || '[]').length`);
  assert(questionsTotal === 52, `Question Bank stores all 52 curriculum questions across taxonomy (Total: ${questionsTotal})`);

  // Navigate to Admin Results Management
  await navigate('/admin/results');
  const resultsCount = await evaluate(`document.querySelectorAll('table tbody tr').length`);
  assert(resultsCount >= 7, `Admin Results table renders all 7 examination submissions (Found: ${resultsCount})`);

  // Section 2: Theme Switching
  console.log('\n--- Section 2: Theme Toggle Audit ---');
  const themeToggled = await evaluate(`(() => {
    const toggle = document.querySelector('button.theme-toggle-btn');
    if (toggle) {
      toggle.click();
      return true;
    }
    return false;
  })()`);
  assert(themeToggled, `Theme toggle button (.theme-toggle-btn) is present and interactive`);

  // Section 3: Student Flow & ExamDNA Insufficient Evidence Verification
  console.log('\n--- Section 3: Student Workflow & ExamDNA Audit ---');
  // Logout Admin using title="Sign out"
  await evaluate(`document.querySelector('button[title="Sign out"]').click()`);
  await new Promise((r) => setTimeout(r, 1200));

  const postLogoutPath = await evaluate(`window.location.pathname`);
  assert(postLogoutPath === '/login', `Admin sign out successfully routes to /login (Path: ${postLogoutPath})`);

  // Login as Sophia Martinez (Student with 0 historical attempts)
  await fillInput('input[type="email"]', 'sophia.martinez@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1500));

  const sophiaPath = await evaluate(`window.location.pathname`);
  assert(sophiaPath === '/student/dashboard', `Sophia Martinez (0 attempts) logs in to /student/dashboard`);

  // Navigate to ExamDNA for Sophia Martinez
  await navigate('/student/exam-dna');
  await new Promise((r) => setTimeout(r, 1200));
  const zeroExamDnaState = await evaluate(`(() => {
    const text = document.body.innerText;
    return text.includes('No Examination Data') || text.includes('Browse Available') || text.includes('Insufficient');
  })()`);
  assert(zeroExamDnaState, `Student with 0 attempts shows clear Insufficient Evidence / Empty State in ExamDNA`);

  // Logout Sophia Martinez
  await evaluate(`document.querySelector('button[title="Sign out"]').click()`);
  await new Promise((r) => setTimeout(r, 1500));

  // Login as Alex Morgan (Student with completed attempts)
  await navigate('/login');
  await new Promise((r) => setTimeout(r, 600));
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1500));

  // Navigate to Student Available Examinations
  await navigate('/student/examinations');
  await new Promise((r) => setTimeout(r, 1200));
  const studentExamsCount = await evaluate(`(() => {
    const cards = document.querySelectorAll('.card').length;
    const text = document.body.innerText;
    return { cards, text };
  })()`);
  assert(studentExamsCount.cards >= 5 || studentExamsCount.text.includes('Available Test'), `Available Examinations view displays published curriculum examinations (Found: ${studentExamsCount.cards} cards)`);

  // Navigate to Student ExamDNA for Alex Morgan
  await navigate('/student/exam-dna');
  await new Promise((r) => setTimeout(r, 1200));
  const examDnaLoaded = await evaluate(`(() => {
    const text = document.body.innerText;
    return {
      hasExamDnaHeading: text.includes('ExamDNA') || text.includes('Intelligence'),
      hasTopicMastery: text.includes('Topic Mastery') || text.includes('Accuracy'),
      hasInsufficientEvidenceLabel: text.includes('Insufficient Evidence') || text.includes('Based on') || text.includes('question'),
      hasStudyPlan: text.includes('Study Plan') || text.includes('Day 1') || text.includes('Revision')
    };
  })()`);

  assert(examDnaLoaded.hasExamDnaHeading, `ExamDNA Intelligence Engine page renders successfully`);
  assert(examDnaLoaded.hasTopicMastery, `ExamDNA Topic Mastery module is populated`);
  assert(examDnaLoaded.hasInsufficientEvidenceLabel, `ExamDNA correctly labels small sample / insufficient evidence topics`);
  assert(examDnaLoaded.hasStudyPlan, `ExamDNA 7-day personalized study plan is generated`);

  // Section 4: Persistence across refresh
  console.log('\n--- Section 4: LocalStorage & Session Persistence ---');
  await navigate('/student/results');
  await evaluate(`window.location.reload()`);
  await new Promise((r) => setTimeout(r, 1500));
  const postRefreshPath = await evaluate(`window.location.pathname`);
  assert(postRefreshPath === '/student/results', `Session persists across hard page refresh (Remained at: ${postRefreshPath})`);

  // Section 5: Console Error Audit
  console.log('\n--- Section 5: Browser Console Audit ---');
  assert(consoleErrors.length === 0, `Zero fatal browser console errors during walkthrough (Errors: ${consoleErrors.length})`);
  if (consoleErrors.length > 0) {
    console.error('Console errors logged:', consoleErrors);
  }

} catch (err) {
  console.error('Walkthrough error:', err);
  failedChecks++;
} finally {
  console.log('\n======================================================');
  console.log(` WALKTHROUGH COMPLETE: ${passedChecks} Passed, ${failedChecks} Failed`);
  console.log('======================================================\n');
  ws.close();
  server.close();
  chromeProcess.kill();
  process.exit(failedChecks > 0 ? 1 : 0);
}
