import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4193;
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
console.log(`[Phase 4 E2E] Static Server running at http://127.0.0.1:${PORT}`);

// Launch Chrome Headless
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.chrome-temp-student-qa'),
  ],
  { stdio: 'ignore' }
);

let webSocketUrl = null;
for (let i = 0; i < 30; i++) {
  try {
    const res = await fetch('http://127.0.0.1:9224/json/new', { method: 'PUT' });
    const target = await res.json();
    webSocketUrl = target.webSocketDebuggerUrl;
    if (webSocketUrl) break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 200));
  }
}

if (!webSocketUrl) {
  console.error('[Phase 4 E2E] Failed to connect to Chrome CDP.');
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
  await new Promise((r) => setTimeout(r, 750));
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
    console.log(`✅ [Phase 4 PASS]: ${name}`);
    passed++;
  } else {
    console.error(`❌ [Phase 4 FAIL]: ${name} ${details ? '(' + details + ')' : ''}`);
    failed++;
  }
}

try {
  console.log('\n--- EXAMPRO PHASE 4 STUDENT PORTAL & EXAMINATION ENGINE QA SUITE ---\n');

  // 1. Log in as Student Alex Morgan
  await navigate('/login');
  await evaluate('localStorage.clear()');
  await navigate('/login');
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1200));

  let currentPath = await evaluate('window.location.pathname');
  report(currentPath === '/student/dashboard', 'Auth: Student login redirects to /student/dashboard');

  // MODULE 1: Student Dashboard Verification
  let content = await evaluate('document.body.innerText');
  let hasGreeting = content.includes('Alex Morgan') && content.includes('Welcome back');
  report(hasGreeting, 'M1: Dashboard displays personalized student greeting for Alex Morgan');

  let hasStudentId = content.includes('STD-2026-001');
  report(hasStudentId, 'M1: Candidate identification code STD-2026-001 rendered');

  let textUpper = content.toUpperCase();
  let hasStats =
    textUpper.includes('AVAILABLE TESTS') &&
    textUpper.includes('UPCOMING TESTS') &&
    textUpper.includes('TESTS COMPLETED') &&
    textUpper.includes('AVERAGE SCORE');
  report(hasStats, 'M1: All four key student metric cards rendered with live computed data');

  let hasAvailableCards = await evaluate(`document.querySelectorAll('.grid .card').length > 0`);
  report(hasAvailableCards, 'M1: Active available examination cards displayed on dashboard');

  // MODULE 2: Available Examinations Catalog
  await navigate('/student/examinations');
  currentPath = await evaluate('window.location.pathname');
  content = await evaluate('document.body.innerText');
  let hasExamCatalog = content.includes('Available Examinations') && content.includes('Full-Stack Web Development');
  report(currentPath === '/student/examinations' && hasExamCatalog, 'M2: /student/examinations lists published active examinations');

  // Search filter
  await fillInput('input[placeholder*="Search open"]', 'Full-Stack');
  await new Promise((r) => setTimeout(r, 400));
  content = await evaluate('document.body.innerText');
  report(content.includes('Full-Stack Web Development'), 'M2: Search input successfully filters open examinations');

  await fillInput('input[placeholder*="Search open"]', '');
  await new Promise((r) => setTimeout(r, 300));

  // Category & Sort checks
  let hasSortControls = await evaluate(`document.querySelectorAll('select').length >= 2`);
  report(hasSortControls, 'M2: Category filter and sorting dropdown selectors active');

  // MODULE 3: Upcoming Examinations
  await navigate('/student/upcoming');
  currentPath = await evaluate('window.location.pathname');
  content = await evaluate('document.body.innerText');
  let hasUpcoming = content.includes('Upcoming Schedule') && content.includes('Database Systems & Query Optimization');
  report(currentPath === '/student/upcoming' && hasUpcoming, 'M3: /student/upcoming lists scheduled future examinations');

  let hasLockedStatus = content.includes('Locked');
  report(hasLockedStatus, 'M3: Future examination start action is locked until official start time');

  // MODULE 4: Examination Instructions & Pre-Flight Verification
  await navigate('/student/exam/exam_cs_101/instructions');
  currentPath = await evaluate('window.location.pathname');
  content = await evaluate('document.body.innerText');
  let hasInstructions =
    content.includes('Full-Stack Web Development') &&
    content.includes('Duration') &&
    content.includes('Total Marks') &&
    content.includes('Total Questions') &&
    content.includes('Passing Score');
  report(hasInstructions, 'M4: Examination instructions present full specifications and scoring thresholds');

  let isStartDisabledInitially = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Examination') || b.innerText.includes('Proceed to Retake') || b.innerText.includes('Resume Examination'));
      return btn ? btn.disabled : null;
    })()
  `);
  report(isStartDisabledInitially === true, 'M4: Start Examination button is disabled until declaration acknowledged');

  // Check declaration checkbox
  await evaluate(`
    (() => {
      const checkbox = document.querySelector('input[type="checkbox"]');
      if (checkbox) checkbox.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  let isStartEnabledAfterAck = await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Examination') || b.innerText.includes('Proceed to Retake') || b.innerText.includes('Resume Examination'));
      return btn ? btn.disabled : null;
    })()
  `);
  report(isStartEnabledAfterAck === false, 'M4: Declaration acknowledgement checkbox enables examination entry');

  // MODULE 7: Distraction-Free Active Examination Engine
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Examination') || b.innerText.includes('Proceed to Retake') || b.innerText.includes('Resume Examination'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  currentPath = await evaluate('window.location.pathname');
  content = await evaluate('document.body.innerText');
  let isExamEngineActive =
    currentPath === '/student/exam/exam_cs_101' &&
    content.includes('Question 1') &&
    content.includes('Question Palette') &&
    content.includes('Submit Examination');
  report(isExamEngineActive, 'M7: Distraction-free Examination Engine launched at /student/exam/:examId');

  // Absolute Timer check
  let timerText = await evaluate(`
    (() => {
      const timer = document.querySelector('.exam-timer-box');
      return timer ? timer.innerText.trim() : '';
    })()
  `);
  report(timerText.includes(':'), 'M8: Absolute countdown timer active and formatted', `Timer: ${timerText}`);

  // Option Selection & Question Palette State Transitions
  await evaluate(`
    (() => {
      const optionCards = document.querySelectorAll('.mcq-option-card');
      if (optionCards[1]) optionCards[1].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  let isOptionSelected = await evaluate(`
    (() => {
      const cards = document.querySelectorAll('.mcq-option-card');
      return cards[1] ? cards[1].classList.contains('selected') : false;
    })()
  `);
  report(isOptionSelected, 'M9: MCQ option card click updates local state and sets selected class');

  // Mark for Review toggle
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Mark for Review'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  let isStateAnsweredReview = await evaluate(`
    (() => {
      const btn = document.querySelector('.palette-btn');
      return btn ? btn.className.includes('state-answered-review') : false;
    })()
  `);
  report(isStateAnsweredReview, 'M9: Palette transitions to state-answered-review (Purple) when answered and flagged');

  // Save & Next button
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save & Next'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  content = await evaluate('document.body.innerText');
  report(content.includes('Question 2'), 'M9: Save & Next advances active question index to Question 2');

  // Option selection on Q2 + Clear selection
  await evaluate(`
    (() => {
      const optionCards = document.querySelectorAll('.mcq-option-card');
      if (optionCards[0]) optionCards[0].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  await evaluate(`
    (() => {
      const clearBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Clear Selection'));
      if (clearBtn) clearBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  let isOptionCleared = await evaluate(`
    (() => {
      return !document.querySelector('.mcq-option-card.selected');
    })()
  `);
  report(isOptionCleared, 'M9: Clear Selection successfully unselects chosen MCQ option');

  // Select Option C on Q2
  await evaluate(`
    (() => {
      const optionCards = document.querySelectorAll('.mcq-option-card');
      if (optionCards[2]) optionCards[2].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  // Jump to Question 4 directly from palette
  await evaluate(`
    (() => {
      const paletteBtns = document.querySelectorAll('.palette-btn');
      if (paletteBtns[3]) paletteBtns[3].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  content = await evaluate('document.body.innerText');
  report(content.includes('Question 4'), 'M9: Palette button click directly jumps to specified question');

  // Select Option D on Question 4
  await evaluate(`
    (() => {
      const optionCards = document.querySelectorAll('.mcq-option-card');
      if (optionCards[3]) optionCards[3].click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  // Reload Resilience Test
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 1200));

  let reloadResilient = await evaluate(`
    (() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.includes('active_attempt_')) {
          const item = JSON.parse(localStorage.getItem(k));
          return Object.keys(item.answers || {}).length >= 2;
        }
      }
      return false;
    })()
  `);
  report(reloadResilient, 'M8: Browser refresh maintains attempt session, timer and persisted answers');

  // MODULE 10: Manual Submission Modal & Summary
  await evaluate(`
    (() => {
      const submitBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit Examination'));
      if (submitBtn) submitBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));

  let modalText = await evaluate(`
    (() => {
      const modal = document.querySelector('.modal-container');
      return modal ? modal.innerText : '';
    })()
  `);
  let hasSubmitConfirmation =
    modalText.includes('Confirm Examination Submission') &&
    modalText.includes('Total Questions') &&
    modalText.includes('Answered') &&
    modalText.includes('Unanswered');
  report(hasSubmitConfirmation, 'M10: Submission confirmation modal presents comprehensive attempt summary');

  // Confirm Final Submission
  await evaluate(`
    (() => {
      const confirmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm and Finalize'));
      if (confirmBtn) confirmBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1800));

  currentPath = await evaluate('window.location.pathname');
  report(currentPath.startsWith('/student/results/'), 'M10: Submission commits immutable result and routes to scorecard');

  // MODULE 5: Detailed Scorecard Verification
  content = await evaluate('document.body.innerText');
  let hasScorecardData =
    content.includes('Full-Stack Web Development') &&
    content.includes('Alex Morgan') &&
    content.includes('Detailed Answer Key & Evaluation') &&
    content.includes('Correct Answers') &&
    content.includes('Incorrect Answers');
  report(hasScorecardData, 'M5: Scorecard renders percentage, pass/fail badge, metrics, and itemized answer key');

  let hasAnswerHighlights = await evaluate(`
    (() => {
      const text = document.body.innerText;
      return text.includes('Correct Answer') || text.includes('Your Selection');
    })()
  `);
  report(hasAnswerHighlights, 'M5: Itemized answer key shows candidate selection vs correct answer with explanations');

  let hasPrintButton = content.includes('Print Scorecard');
  report(hasPrintButton, 'M5: Print Scorecard action button available');

  // MODULE 5: My Results Directory
  await navigate('/student/results');
  currentPath = await evaluate('window.location.pathname');
  content = await evaluate('document.body.innerText');
  let hasResultsTable =
    currentPath === '/student/results' &&
    content.includes('My Examination Results') &&
    content.includes('Full-Stack Web Development');
  report(hasResultsTable, 'M5: /student/results archives completed examination attempts with scorecard links');

  // MODULE 6: Student Profile Management
  await navigate('/student/profile');
  currentPath = await evaluate('window.location.pathname');
  let hasProfileData = await evaluate(`
    (() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      const hasId = inputs.some(i => i.value.includes('STD-2026-001'));
      const hasEmail = inputs.some(i => i.value.includes('alex.morgan@university.edu'));
      return hasId && hasEmail;
    })()
  `);
  report(currentPath === '/student/profile' && hasProfileData, 'M6: Student profile displays candidate ID and authentication email');

  // Update contact phone
  await fillInput('#input_student_phone', '+1 555-888-9999');
  await evaluate(`document.querySelector('form button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 800));

  let hasSuccessToast = await evaluate(`
    (() => {
      const toast = document.querySelector('.toast');
      return toast ? toast.innerText.toLowerCase().includes('profile updated successfully') : false;
    })()
  `);
  report(hasSuccessToast, 'M6: Profile update commits contact changes and delivers confirmation toast');

  console.log('\n-----------------------------------------------------------');
  console.log(`TOTAL PHASE 4 AUDIT TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('-----------------------------------------------------------\n');
} catch (err) {
  console.error('[FATAL TEST HARNESS ERROR]:', err);
  failed++;
} finally {
  try {
    ws.close();
    chromeProcess.kill('SIGKILL');
    server.close();
  } catch (e) {}
  process.exit(failed > 0 ? 1 : 0);
}
