// Smoke test for the overlay_window addon: node native/smoke-test.js ["Window Title"]
//
// Asserts the module loads, exports what src/main/overlay.ts expects, and that the
// UIA calls are safe with no target attached. Then starts the hook and prints the
// events it sees for 3s - focus/move the target window to watch them arrive.
/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS node script */
const assert = require('node:assert')
const { join } = require('node:path')

const lib = require(join(__dirname, '../resources/overlay_window.node'))

assert.deepStrictEqual(Object.keys(lib).sort(), [
  'clickButtonWithImage',
  'findButtonsWithImages',
  'findEditControls',
  'focusTarget',
  'inputTextToEdit',
  'start'
])

// No target window attached yet: every UIA call must fail cleanly, not crash.
assert.deepStrictEqual(lib.findEditControls(), { found: false, count: 0 })
assert.deepStrictEqual(lib.findButtonsWithImages(), { found: false, count: 0 })
assert.strictEqual(lib.inputTextToEdit(0, 'nobody'), false)
assert.strictEqual(lib.clickButtonWithImage(0), false)

const title = process.argv[2] || 'Riot Client'
const events = []
lib.start(title, (e) => {
  events.push(e)
  console.log('event', e)
})

setTimeout(() => {
  console.log(`ok - ${events.length} event(s) for "${title}"`)
  // the hook thread keeps the loop alive, so leave explicitly
  process.exit(0)
}, 3000)
