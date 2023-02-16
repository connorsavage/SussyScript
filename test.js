import assert from "assert/strict"
import fs from "fs"
import ohm from "ohm-js"

const syntaxChecks = [
  ["all numeric literal forms", "report(8 * 89.123)"],
  ["complex expressions", "report(83 * ((((-((((13 / 21)))))))) + 1 - 0)"],
  ["all unary operators", "report (-3) report (!imposter)"],
  ["all binary operators", "report x && y || z * 1 / 2 ** 3 + 4 < 5"],
  ["all arithmetic operators", "varus x = (!3) * 2 + 4 - (-7.3) * 8 ** 13 / 1"],
  ["all relational operators", "varus x = 1<(2<=(3==(4!=(5 >= (6>7)))))"],
  ["all logical operators", "varus x = crewmate && imposter || (!imposter)"],
  ["the conditional operator", "report x ? y : z"],
  ["end of program inside comment", "report(0) cR yay"],
  ["comments with no text are ok", "report(1)cR\nreport(0)cR"],
  ["non-Latin letters in identifiers", "コンパイラ = 100"],
]

const syntaxErrors = [
  ["non-letter in an identifier", "ab😭c = 2", /Line 1, col 3/],
  ["malformed number", "x= 2.", /Line 1, col 6/],
  ["missing semicolon", "x = 3 y = 1", /Line 1, col 7/],
  ["a missing right operand", "report(5 -", /Line 1, col 10/],
  ["a non-operator", "report(7 * ((2 _ 3)", /Line 1, col 15/],
  ["an expression starting with a )", "x = )", /Line 1, col 5/],
  ["a statement starting with expression", "x * 5", /Line 1, col 3/],
  ["an illegal statement on line 2", "report(5)\nx * 5", /Line 2, col 3/],
  ["a statement starting with a )", "report(5)\n) * 5", /Line 2, col 1/],
  ["an expression starting with a *", "x = * 71", /Line 1, col 5/],
]

describe("The grammar", () => {
  const grammar = ohm.grammar(fs.readFileSync("src/sussyScript.ohm"))
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(grammar.match(source).succeeded())
    })
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      const match = grammar.match(source)
      assert(!match.succeeded())
      assert(new RegExp(errorMessagePattern).test(match.message))
    })
  }
})

import assert from "assert/strict"
import util from "util"
import compile from "../src/compiler.js"

const sampleProgram = "print 0;"

describe("The compiler", () => {
  it("throws when the output type is unknown", (done) => {
    assert.throws(() => compile("print(0);", "blah"), /Unknown output type/)
    done()
  })
  it("accepts the analyzed option", (done) => {
    const compiled = compile(sampleProgram, "analyzed")
    assert(util.format(compiled).startsWith("   1 | Program"))
    done()
  })
  it("accepts the optimized option", (done) => {
    const compiled = compile(sampleProgram, "optimized")
    assert(util.format(compiled).startsWith("   1 | Program"))
    done()
  })
  it("generates js code when given the js option", (done) => {
    const compiled = compile(sampleProgram, "js")
    assert(util.format(compiled).startsWith("console.log(0)"))
    done()
  })
})
