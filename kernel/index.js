const fs = require('fs')
const os = require("os")
const path = require('path')
const fetch = require('cross-fetch');
const system = require('systeminformation');
const Loader = require("./loader")
const Bin = require('./bin')
const Api = require("./api")
const Template = require('./template')
const Shells = require("./shells")
const Config = require("./pinokio.json")
//const memwatch = require('@airbnb/node-memwatch');
class Kernel {
  constructor(store) {
    this.fetch = fetch
    this.store = store
    let home = this.store.get("home")
    if (home) {
      this.homedir = home
    } else {
      this.homedir = path.resolve(os.homedir(), "pinokio")
    }
    this.loader = new Loader()
    this.bin = new Bin(this)
    this.api = new Api(this)
    this.shell = new Shells(this)
    this.system = system
    this.keys = {}
    this.memory = {
      local: {},
      global: {},
      key: (host) => {
        return this.keys[host]
      }
    }
    this.procs = {}
    this.template = new Template(this)
  }
  resumeprocess(uri) {
    let proc = this.procs[uri]
    if (proc && proc.resolve) {
      proc.resolve()
      this.procs[uri] = undefined
    }
  }
  path(...args) {
    return path.resolve(this.homedir, ...args)
  }
  async init() {
    try {
      await fs.promises.mkdir(this.homedir, { recursive: true }).catch((e) => {})
      let contents = await fs.promises.readdir(this.homedir)
      await this.bin.init()
      await this.api.init()
      await this.template.init()
    } catch (e) {
    }
  }
}
module.exports = Kernel