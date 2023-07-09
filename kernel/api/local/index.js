const set = require("../rm")
const rm = require("../rm")
class Local {
  async set(req, ondata, kernel) {
    /*
      req := {
        "method": "local.set",
        "params": {
          <key>: <val>,
          <key>: <val>,
        }
      }

      equivalent to:

      req := {
        "method": "set",
        "params": {
          "local": {
            <key>: <val>,
            <key>: <val>,
          }
        }
      }
    */
    let converted = Object.assign({}, req, {
      params: {
        local: req.params
      }
    })
    let res = await set(converted, ondata, kernel)
    return res
  }
  async rm(req, ondata, kernel) {
    /*
      req := {
        "method": "local.rm",
        "params": [<key>, <key>, ..]
      }

      equivalent to:

      req := {
        "method": "rm",
        "params": {
          "local": [<key>, <key>, ..]
        }
      }
    */
    let converted = Object.assign({}, req, {
      params: {
        local: req.params
      }
    })
    let res = await rm(converted, ondata, kernel)
    return res
  }
}
module.exports = Local
