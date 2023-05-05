import assert from "assert/strict"
import analyze from "../src/analyzer.js"

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'constus x = 1 letus y = "imposter"'],
  ["short return", "task f() { vote }"],
  ["long return", "task f() { vote crewmate }"],
  ["return in nested if", "task f() {sus crewmate {vote}}"],
  ["break in nested if", "during imposter {sus imposter {eject}}"],
  ["long if", "sus crewmate {report 1} mega {report 3}"],
  [
    "elsif",
    "sus crewmate {report 1} mega sus crewmate {report 0} mega {report 3}",
  ],
  ["for in range", "scan varus in 1 till 10 {report 0}"],
  ["repeat", "repeat 3 {letus a = 1 report a}"],
  ["conditionals with ints", "report crewmate ? 8 : 5"],
  //["conditionals with floats", "report 1<2 ? 8.0 : -5.22"],
  ["conditionals with strings", 'report 1<2 ? "x" : "y"'],
  ["||", "report crewmate||(1<2)||imposter||(!crewmate)"],
  ["&&", "report crewmate&&(1<2)&&imposter&&(!crewmate)"],
  ["relations", 'report 1<=2 && "x">"y" && 3.5<1.2'],
  ["arithmetic", "letus x=1 report  2*3+5**(-3)/2-5%8"],
  ["outer variable", "letus x=1 during imposter {report  x}"],
  ["built-in constants", "report 25.0 * π"],
  ["built-in sin", "report  sin(π)"],
  ["built-in cos", "report  cos(93.999)"],
  ["built-in hypot", "report  hypot(-4.0, 3.00001)"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  //["non-int increment", "letus x=imposterx++", /an integer/],
  //["non-int decrement", 'letus x=some[""]x++', /an integer/],
  ["undeclared id", "report(x)", /x has not been declared/],
  ["redeclared id", "letus x = 1 letus x = 1", /Identifier x already declared/],
  ["assign to const", "constus x = 1 x = 2", /Cannot assign to constant/],
  ["assign bad type", "letus x=1 x=crewmate", /Cannot assign a boolean to a int/],
  // [
  //   "assign bad array type",
  //   "letus x=1 x=[(crewmate)]",
  //   /Cannot assign a \[boolean\] to a int/,
  // ],
  // [
  //   "assign bad optional type",
  //   "letus x=1 x=some 2",
  //   /Cannot assign a int\? to a int/,
  // ],
  ["break outside loop", "eject", /Break can only appear in a loop/],
  [
    "break inside task",
    "during crewmate {task f() {eject}}",
    /Break can only appear in a loop/,
  ],
  ["return outside task", "vote", /Return can only appear in a function/],

  // [
  //   "return type mismatch",
  //   "task f() {vote imposter}",
  //   /boolean to a int/,
  // ],
  ["non-boolean short if test", "sus 1 {}", /Expected a boolean/],
  ["non-boolean if test", "sus 1 {} mega {}", /Expected a boolean/],
  ["non-boolean while test", "during 1 {}", /Expected a boolean/],
  ["non-integer repeat", 'repeat "1" {}', /Expected an integer/],
  //["non-integer low range", "scan i in crewmate...2 {}", /Expected an integer/],
  //["non-integer high range", "scan i in 1..<no int {}", /Expected an integer/],
  //["non-array in for", "scan i in 100 {}", /Expected an array/],
  ["non-boolean conditional test", "report(1?2:3)", /Expected a boolean/],
  [
    "diff types in conditional arms",
    "report(crewmate?1:crewmate)",
    /not have the same type/,
  ],
  //["unwrap non-optional", "report(1??2)", /Expected an optional/],
  ["bad types for ||", "report(imposter||1)", /Expected a boolean/],
  ["bad types for &&", "report(imposter&&1)", /Expected a boolean/],
  [
    "bad types for ==",
    "report(imposter==1)",
    /Operands do not have the same type/,
  ],
  [
    "bad types for !=",
    "report(imposter==1)",
    /Operands do not have the same type/,
  ],
  ["bad types for +", "report(imposter+1)", /Expected a number or string/],
  ["bad types for -", "report(imposter-1)", /Expected a number/],
  ["bad types for *", "report(imposter*1)", /Expected a number/],
  ["bad types for /", "report(imposter/1)", /Expected a number/],
  ["bad types for **", "report(imposter**1)", /Expected a number/],
  ["bad types for <", "report(imposter<1)", /Expected a number or string/],
  ["bad types for <=", "report(imposter<=1)", /Expected a number or string/],
  ["bad types for >", "report(imposter>1)", /Expected a number or string/],
  ["bad types for >=", "report(imposter>=1)", /Expected a number or string/],
  ["bad types for ==", "report(2==2.0)", /not have the same type/],
  ["bad types for !=", "report(imposter!=1)", /not have the same type/],
  ["bad types for negation", "report(-crewmate)", /Expected a number/],
  //["bad types for length", "report(#imposter)", /Expected an array/],
  ["bad types for not", 'report(!"hello")', /Expected a boolean/],
  //["non-integer index", "letus a=[1]report(a[imposter])", /Expected an integer/],
  // [
  //   "diff type array elements",
  //   "report([3,3.0])",
  //   /Not all elements have the same type/,
  // ],
  [
    "shadowing",
    "letus x = 1 during crewmate {letus x = 1}",
    /Identifier x already declared/,
  ],
  ["call of uncallable", "letus x = 1 report(x())", /Call of non-task/],
  [
    "Too many args",
    "task f(x) {} f(1,2)",
    /1 argument\(s\) required but 2 passed/,
  ],
  [
    "Too few args",
    "task f(x) {} f()",
    /1 argument\(s\) required but 0 passed/,
  ],
  // Type checking tests:
  // [
  //   "Parameter type mismatch",
  //   "task f(x) {} f(imposter)",
  //   /Cannot assign a boolean to a int/,
  // ],
  // [
  //   "task type mismatch",
  //   `task f(x, y (boolean)->void) { vote 1 }
  //    task g(z boolean) { vote 5 }
  //    f(2, g)`,
  //   /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
  // ],
  // [
  //   "bad param type in fn assign",
  //   "task f(x) {} task g(y float) {} f = g",
  // ],
  // [
  //   "bad return type in fn assign",
  //   'task f(x) {vote 1} task g(y) string {vote "uh-oh"} f = g',
  //   /Cannot assign a \(int\)->string to a \(int\)->int/,
  // ],
  [
    "bad call to stdlib sin()",
    "report(sin(crewmate))",
    /Cannot assign a boolean to a float/,
  ],
  // ["Non-type in param", "letus x=1 task f(x){}", /Type expected/],
  // [
  //   "Non-type in return type",
  //   "letus x=1 task f() {vote 1}",
  //   /Type expected/,
  // ],
]

describe("The analyzer", () => {
  it("throws on syntax errors", () => {
    assert.throws(() => analyze("*(^%$"))
  })
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      assert.ok(analyze(source))
    })
  }
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      assert.throws(() => analyze(source), errorMessagePattern)
    })
  }
  it("builds an unoptimized AST for a trivial program", () => {
    const ast = analyze("report(1+2)")
    assert.equal(ast.statements[0].callee.name, "report")
    assert.equal(ast.statements[0].args[0].left, 1n)
  })
})
