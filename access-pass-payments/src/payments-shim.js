// Shim for 8th Wall's proprietary payments module (not included in export)
const noop = () => {}
const config = { subscribe: (cb) => ({ unsubscribe: noop }) }
class AccessPass {
  constructor() {}
  static create() { return new AccessPass() }
  check() { return Promise.resolve({ hasAccess: true }) }
  purchase() { return Promise.resolve({ success: true }) }
}
export { AccessPass, config }
