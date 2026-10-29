import fs from 'node:fs'
import path from 'node:path'

const [,, junitPath, htmlPath] = process.argv

if (!junitPath || !htmlPath) {
  console.error('Usage: node junit-to-html.mjs <junit.xml> <report.html>')
  process.exit(2)
}

const xml = fs.readFileSync(junitPath, 'utf8')

function getAttr(tag, attr) {
  const m = new RegExp(`${attr}="([^"]*)"`).exec(tag)
  return m ? m[1] : ''
}

const suiteMatch = xml.match(/<testsuite\b[^>]*>/)
const suiteTag = suiteMatch ? suiteMatch[0] : ''
const suiteName = getAttr(suiteTag, 'name') || 'Vitest'
const tests = Number(getAttr(suiteTag, 'tests') || '0')
const failures = Number(getAttr(suiteTag, 'failures') || '0')
const errors = Number(getAttr(suiteTag, 'errors') || '0')
const skipped = Number(getAttr(suiteTag, 'skipped') || '0')
const passed = Math.max(0, tests - failures - errors - skipped)

const testcases = [...xml.matchAll(/<testcase\b[^>]*>([\s\S]*?)<\/testcase>/g)].map((m) => {
  const tag = m[0].match(/<testcase\b[^>]*>/)?.[0] ?? ''
  const name = getAttr(tag, 'name')
  const classname = getAttr(tag, 'classname')
  const time = getAttr(tag, 'time')
  const body = m[1]
  const failure = body.match(/<failure\b[^>]*>([\s\S]*?)<\/failure>/)
  const error = body.match(/<error\b[^>]*>([\s\S]*?)<\/error>/)
  const skippedTag = body.match(/<skipped\b[^>]*\/>|<skipped\b[^>]*>.*?<\/skipped>/)
  const status = failure ? 'FAILED' : error ? 'ERROR' : skippedTag ? 'SKIPPED' : 'PASSED'
  const details = (failure?.[1] || error?.[1] || '').trim()
  return { name, classname, time, status, details }
})

const esc = (s) => String(s)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

const rows = testcases.map(tc => {
  const details = tc.details ? `<details><summary>details</summary><pre>${esc(tc.details)}</pre></details>` : ''
  return `
    <tr class="status-${tc.status}">
      <td>${esc(tc.status)}</td>
      <td>${esc(tc.classname)}</td>
      <td>${esc(tc.name)}</td>
      <td>${esc(tc.time)}</td>
      <td>${details}</td>
    </tr>`
}).join('\n')

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(suiteName)} - Test Report</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; margin: 24px; }
    .summary { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0 18px; }
    .pill { border: 1px solid #ddd; border-radius: 999px; padding: 6px 12px; background: #fafafa; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #e5e5e5; padding: 8px 10px; vertical-align: top; }
    th { background: #f6f6f6; text-align: left; }
    tr.status-PASSED td:first-child { color: #0a7a0a; font-weight: 600; }
    tr.status-FAILED td:first-child, tr.status-ERROR td:first-child { color: #b00020; font-weight: 600; }
    tr.status-SKIPPED td:first-child { color: #6b7280; font-weight: 600; }
    pre { white-space: pre-wrap; word-break: break-word; margin: 8px 0 0; }
  </style>
</head>
<body>
  <h1>${esc(suiteName)} - Test Report</h1>
  <div class="summary">
    <div class="pill">Total: <strong>${tests}</strong></div>
    <div class="pill">Passed: <strong>${passed}</strong></div>
    <div class="pill">Failed: <strong>${failures}</strong></div>
    <div class="pill">Errors: <strong>${errors}</strong></div>
    <div class="pill">Skipped: <strong>${skipped}</strong></div>
  </div>
  <h2>Testcases</h2>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Suite</th>
        <th>Name</th>
        <th>Time (s)</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No testcases found in JUnit report.</td></tr>'}
    </tbody>
  </table>
  <hr />
  <h2>Raw JUnit XML</h2>
  <details>
    <summary>Show</summary>
    <pre>${esc(xml)}</pre>
  </details>
</body>
</html>`

fs.mkdirSync(path.dirname(htmlPath), { recursive: true })
fs.writeFileSync(htmlPath, html, 'utf8')
console.log(`Wrote ${htmlPath}`)

