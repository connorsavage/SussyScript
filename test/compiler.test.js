import assert from "assert/strict"
import util from "util"
import compile from "../src/compiler.js"

const sampleProgram = "report 0"

describe("The compiler", () => {
  it("throws when the output type is unknown", (done) => {
    assert.throws(() => compile("report(0)", "blah"), /Unknown output type/)
    done()
  })
  it("accepts the analyzed option", (done) => {
    const compiled = compile(sampleProgram, "analyzed")
    assert(util.format(compiled).startsWith("   1 | Program"))
    done()
  })
  
})
