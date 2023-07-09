const os = require("os")
const system = require('systeminformation');
const jp = require('jsonpath');
const path = require("path")
const fs = require("fs")
const _ = require("lodash")
class Template {
  constructor(kernel) {
    this.kernel = kernel
  }
  async init() {
  }
  istemplate(o) {
    let check
    _.forOwn(o, (val, key) => {
      if (typeof key === 'string') {
        let test = /\{\{.*\}\}/g.test(key)
        if (test) {
          check = true
        }
      }
      if (typeof val === 'string') {
        let test = /\{\{.*\}\}/g.test(val)
        if (test) {
          check = true
        }
      }
    });
    return check
  }
  flatten(template) {
    let result
    if (typeof template === "string") {
      result = template.replaceAll(/\{\{\{(.*?)\}\}\}/g, '{{$1}}');
    } else if (Array.isArray(template)) {
      result = template.map((item) => {
        return this.flatten(item)
      })
    } else if (typeof template === "object") {
      if (template.constructor.name === 'Object') {
        try {
          result = {}
          for (let key in template) {
            let flattenedKey = this.flatten(key)
            let flattenedVal = this.flatten(template[key])
            if (flattenedKey !== null && flattenedKey !== false) {
              result[flattenedKey] = flattenedVal;
            }
          }
        } catch (e) {
          result = template
        }
      } else {
        result = template
      }
    } else {
      result = template
    }
    return result
  }
  render(template, vars) {
    let result

    // CASE 1. String type => can be a regular string or a template string
    if (typeof template === "string") {


      if (/^\{\{\{(.+)\}\}\}$/g.test(template)) {
        // CASE 1.0. {{{ }}} raw expression => don't parse
        return template

      } 

      else if (/^\{\{.+\}\}$/g.test(template)) {
        // CASE 1.1. the template expression is a pure template (starts with {{ and ends with }})

        // Example:
        //  "{{buf}}" where buf is a Buffer object
        //  "{{items}}" where items is an Array
        //  "{{int}}" where the int is an integer

        // get only the variables out
        let v = template.slice(2, -2)
        let r = this.raw_get(v, vars)
        return r
      }

      // CASE 1.2. if the template expression is part of a string "... {{ .. }} ..." => can only be string
      else {
        try {
          const pattern = /{{(.*?)}}/g;
          const matches = [...template.matchAll(pattern)].map((x) => { return x[1] })
          if (matches && matches.length > 0) {
            let vals = []
            for(let v of matches) {
              let val = this.raw_get(v, vars)
              vals.push({
                key: "{{" + v + "}}",
                val
              })
            }
            let res = template
            for(let val of vals) {
              res = res.replaceAll(val.key, val.val)
            }
            return res
          } else {
            return template
          }

        } catch (e) {
          result = template
        }
      }

    }
    // Case 2: Array
    else if (Array.isArray(template)) {
      result = []
      for(let item of template) {
        let renderedVal = this.render(item, vars);
        if (typeof renderedVal !== "undefined") {
          result.push(renderedVal) 
        }
      }
    }
    // Case 2: the template is an object => need to traverse further
    else if (typeof template === "object") {
      if (template.constructor.name === 'Object') {
        try {
          result = {}
          for (let key in template) {
            let renderedKey = this.render(key, vars);
            let renderedVal = this.render(template[key], vars);
            if (renderedKey !== null && renderedKey !== false) {
              result[renderedKey] = renderedVal;
            }
          }
        } catch (e) {
          result = template
        }
      } else {
        result = template
      }
    }

    // Case 3: terminal node => can just use the value
    else {
      result = template
    }
    return result
  }
  raw_get(o, vars) {
    let fun = new Function("uri", "cwd", "key", "local", "global", "self", "input", "current", "next", "event", "_", "os", "path", "system", `return ${o}`)
    try {
      let response = fun(vars.uri, vars.cwd, vars.key, vars.local, vars.global, vars.self, vars.input, vars.current, vars.next, vars.event, _, os, path, system)
      if (typeof response === "undefined") {
        return `{{${o}}}`
      } else {
        return response
      }
    } catch (e) {
      return `{{${o}}}`
    }

  }
}
module.exports = Template
