import assert from "assert/strict"
import fs from "fs"
import ohm from "ohm-js"

const syntaxChecks = [
  ["all numeric literal forms", "report(8 * 89.123)"],
  ["complex expressions", "report(83 * ((((-((((13 / 21)))))))) + 1 - 0)"],
  ["all unary operators", "report (-3) report (!false)"],
  ["all binary operators", "report x && y || z * 1 / 2 ** 3 + 4 < 5"],
  ["all arithmetic operators", "letus x = (!3) * 2 + 4 - (-7.3) * 8 ** 13 / 1"],
  ["all relational operators", "letus x = 1<(2<=(3==(4!=(5 >= (6>7)))))"],
  ["all logical operators", "letus x = true && false || (!false)"],
  ["the conditional operator", "report x ? y : z"],
  ["end of program inside comment", "report(0) cR yay"],
  ["comments with no text are ok", "report(1)cR\nreport(0)cR"],
  ["non-Latin letters in identifiers", "コンパイラ = 100"],
]

const syntaxErrors = [
  ["non-letter in an identifier", "ab😭c = 2", /Line 1, col 3/],
  ["malformed number", "x= 2.", /Line 1, col 6/],
  ["a missing right operand", "report(5 -", /Line 1, col 11/],
  ["a non-operator", "report(7 * ((2 _ 3)", /Line 1, col 16/],
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
