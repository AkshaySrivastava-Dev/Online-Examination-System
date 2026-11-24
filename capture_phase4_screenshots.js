import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4194;
const DIST_DIR = path.resolve('dist');
const ARTIFACT_DIR = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\dcb9fc8e-7d21-40b0-86d9-0999a86947aa';

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

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9225',
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=' + path.resolve('.chrome-temp-shots'),
  ],
  { stdio: 'ignore' }
);

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
  process.exit(1);
}

const ws = new WebSocket(webSocketUrl);
let id = 1;
const pending = new Map();

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(msg.error);
    else resolve(msg.result);
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
await send('Emulation.setDeviceMetricsOverride', {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

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
  await new Promise((r) => setTimeout(r, 800));
}

async function capture(filename) {
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const outPath = path.join(ARTIFACT_DIR, filename);
  fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
  console.log(`Saved screenshot: ${outPath}`);
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

try {
  // 1. Login
  await navigate('/login');
  await evaluate('localStorage.clear()');
  await navigate('/login');
  await fillInput('input[type="email"]', 'alex.morgan@university.edu');
  await fillInput('input[type="password"]', 'Student@123');
  await evaluate(`document.querySelector('button[type="submit"]').click()`);
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 1: Student Dashboard
  await capture('student_dashboard.png');

  // Screenshot 2: Available Examinations
  await navigate('/student/examinations');
  await capture('available_examinations.png');

  // Screenshot 3: Examination Engine
  await navigate('/student/exam/exam_cs_101/instructions');
  await evaluate(`
    (() => {
      const cb = document.querySelector('input[type="checkbox"]');
      if (cb) cb.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));
  await evaluate(`
    (() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Examination') || b.innerText.includes('Proceed to Retake'));
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));

  // Select Option B and flag for review on Q1
  await evaluate(`
    (() => {
      const cards = document.querySelectorAll('.mcq-option-card');
      if (cards[1]) cards[1].click();
      const rev = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Mark for Review'));
      if (rev) rev.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));
  await capture('exam_engine_active.png');

  // Answer Q2 and submit to get scorecard
  await evaluate(`
    (() => {
      const next = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Save & Next'));
      if (next) next.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));
  await evaluate(`
    (() => {
      const cards = document.querySelectorAll('.mcq-option-card');
      if (cards[0]) cards[0].click();
      const sub = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Submit Examination'));
      if (sub) sub.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));
  await evaluate(`
    (() => {
      const conf = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Confirm and Finalize'));
      if (conf) conf.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1800));

  // Screenshot 4: Scorecard
  await capture('student_scorecard.png');

} catch (err) {
  console.error('Error during screenshot capture:', err);
} finally {
  try {
    ws.close();
    chromeProcess.kill('SIGKILL');
    server.close();
    fs.rmSync(path.resolve('.chrome-temp-shots'), { recursive: true, force: true });
  } catch {}
}

