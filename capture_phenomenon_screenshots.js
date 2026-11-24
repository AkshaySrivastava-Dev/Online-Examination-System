import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PORT = 4195;
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
console.log(`[Screenshot Server] Running at http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(
  chromePath,
  [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--no-first-run',
    '--no-default-browser-check',
    '--window-size=1440,900',
    '--user-data-dir=' + path.resolve('.chrome-temp-screenshots'),
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
  console.error('Failed to connect to Chrome.');
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
  await new Promise((r) => setTimeout(r, 1200));
}

async function captureScreenshot(fileName) {
  const res = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(res.data, 'base64');
  const targetPath = path.join(ARTIFACT_DIR, fileName);
  fs.writeFileSync(targetPath, buffer);
  console.log(`Saved screenshot: ${fileName}`);
}

try {
  // 1. Capture Login Screen
  await navigate('/login');
  await captureScreenshot('login_phenomenon.png');

  // 2. Log in as Admin and capture Dashboard
  await evaluate(`
    (() => {
      const emailSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const email = document.querySelector('input[type="email"]');
      const pass = document.querySelector('input[type="password"]');
      emailSetter.call(email, 'admin@exampro.com');
      email.dispatchEvent(new Event('input', { bubbles: true }));
      emailSetter.call(pass, 'Admin@123');
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('button[type="submit"]').click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1800));
  await captureScreenshot('admin_dashboard_phenomenon.png');

  // 3. Log out and log in as Student Alex Morgan
  await evaluate(`
    (() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.title === 'Sign out' || b.getAttribute('aria-label') === 'Sign out');
      if (logoutBtn) logoutBtn.click();
    })()
  `);
  await navigate('/login');
  await evaluate(`
    (() => {
      const emailSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const email = document.querySelector('input[type="email"]');
      const pass = document.querySelector('input[type="password"]');
      emailSetter.call(email, 'alex.morgan@university.edu');
      email.dispatchEvent(new Event('input', { bubbles: true }));
      emailSetter.call(pass, 'Student@123');
      pass.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('button[type="submit"]').click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 1800));
  await captureScreenshot('student_dashboard_phenomenon.png');

  // 4. Capture Exam Engine
  await navigate('/student/exam/ex_midterm_cs101');
  await new Promise((r) => setTimeout(r, 1500));
  await captureScreenshot('exam_engine_phenomenon.png');

  console.log('All Phenomenon Studio screenshots successfully captured!');
} catch (err) {
  console.error('Error capturing screenshots:', err);
} finally {
  try {
    chromeProcess.kill();
    server.close();
  } catch (e) {}
  process.exit(0);
}

