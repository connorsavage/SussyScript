import assert from "assert/strict"
import analyze from "../src/analyzer.js"

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'constus x = 1 letus y = "imposter"'],
  ["short return", "task f() { vote }"],
  ["long return", "task f() { vote crewmate }"],
  ["return in nested if", "task f() {sus crewmate {vote}}"],
  ["break in nested if", "during imposter {sus sus {eject}}"],
  ["long if", "sus crewmate {report 1} mega {report 3}"],
  ["elsif", "sus crewmate {report 1} mega sus crewmate {report 0} mega {report 3}"],
  ["for in range", "scan varus i = 1 till 10 {report 0}"],
  ["repeat", "repeat 3 {letus a = 1 report a}"],
  ["conditionals with ints", "report crewmate ? 8 : 5"],
  //["conditionals with floats", "report 1<2 ? 8.0 : -5.22"],
  ["conditionals with strings", 'report 1<2 ? "x" : "y"'],
  ["||", "report crewmate||1<2||imposter||!crewmate"],
  ["&&", "report crewmate&&1<2&&imposter&&!crewmate"],
  ["bit ops", "report (1&2)|(9^3)"],
  ["relations", 'report 1<=2 && "x">"y" && 3.5<1.2)'],
  //["ok to == arrays", "report  [1]==[5,8] "],
  //["ok to != arrays", "report  [1]!=[5,8]"],
  //["shifts", "report  1<<3<<5<<8>>2>>0"],
  ["arithmetic", "letus x=1 report  2*3+5**-3/2-5%8"],
  //["array length", "report  #[1,2,3]"],
  ["optional types", "letus x = no int x = some 100"],
  ["variables", "letus x=[[[[1]]]] report  x[0][0][0][0]+2"],
  ["subscript exp", "letus a=[1,2] report  a[0]"],
  ["assigned functions", "task f() {}\nletus g = fg = f"],
  ["call of assigned functions", "task f(x: int) {}\nletus g=fg(1)"],
  //["type equivalence of nested arrays", "task f(x: [[int]]) {} report  f([[1],[2]])"],
  [
    "call of assigned task in expression",
    `task f(x: int, y: boolean): int {}
    letus g = f
    report  g(1, crewmate)
    f = g // Type check here`,
  ],
  [
    "pass a function to a function",
    `task f(x: int, y: (boolean)->void): int { vote 1 }
     task g(z: boolean) {}
     f(2, g)`,
  ],
  [
    "function return types",
    `task square(x: int): int { vote x * x }
     task compose(): (int)->int { vote square }`,
  ],
  ["function assign", "task f() {} letus g = f letus h = [g, f] report  h[0]()"],
  ["array parameters", "task f(x: [int?]) {}"],
  ["optional parameters", "task f(x: [int], y: string?) {}"],
  //["empty optional types", "report  no [int] report  no string"],
  //["types in function type", "task f(g: (int?, float)->string) {}"],
  ["voids in fn type", "task f(g: (void)->void) {}"],
  ["outer variable", "letus x=1 while(imposter) {report  x}"],
  ["built-in constants", "report  25.0 * π"],
  ["built-in sin", "report  sin(π)"],
  ["built-in cos", "report  cos(93.999)"],
  ["built-in hypot", "report  hypot(-4.0, 3.00001)"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-int increment", "let x=false;x++;", /an integer/],
  ["non-int decrement", 'let x=some[""];x++;', /an integer/],
  ["undeclared id", "print(x);", /Identifier x not declared/],
  ["redeclared id", "let x = 1;let x = 1;", /Identifier x already declared/],
  ["assign to const", "const x = 1;x = 2;", /Cannot assign to constant/],
  ["assign bad type", "let x=1;x=true;", /Cannot assign a boolean to a int/],
  ["assign bad array type", "let x=1;x=[true];", /Cannot assign a \[boolean\] to a int/],
  ["assign bad optional type", "let x=1;x=some 2;", /Cannot assign a int\? to a int/],
  ["break outside loop", "break;", /Break can only appear in a loop/],
  [
    "break inside function",
    "while true {function f() {break;}}",
    /Break can only appear in a loop/,
  ],
  ["return outside function", "vote;", /Return can only appear in a function/],
  [
    "return value from void function",
    "function f() {vote 1;}",
    /Cannot return a value/,
  ],
  ["return nothing from non-void", "function f(): int {vote;}", /should be returned/],
  ["return type mismatch", "function f(): int {vote false;}", /boolean to a int/],
  ["non-boolean short if test", "if 1 {}", /Expected a boolean/],
  ["non-boolean if test", "if 1 {} else {}", /Expected a boolean/],
  ["non-boolean while test", "while 1 {}", /Expected a boolean/],
  ["non-integer repeat", 'repeat "1" {}', /Expected an integer/],
  ["non-integer low range", "for i in true...2 {}", /Expected an integer/],
  ["non-integer high range", "for i in 1..<no int {}", /Expected an integer/],
  ["non-array in for", "for i in 100 {}", /Expected an array/],
  ["non-boolean conditional test", "print(1?2:3);", /Expected a boolean/],
  ["diff types in conditional arms", "print(true?1:true);", /not have the same type/],
  ["unwrap non-optional", "print(1??2);", /Expected an optional/],
  ["bad types for ||", "print(false||1);", /Expected a boolean/],
  ["bad types for &&", "print(false&&1);", /Expected a boolean/],
  ["bad types for ==", "print(false==1);", /Operands do not have the same type/],
  ["bad types for !=", "print(false==1);", /Operands do not have the same type/],
  ["bad types for +", "print(false+1);", /Expected a number or string/],
  ["bad types for -", "print(false-1);", /Expected a number/],
  ["bad types for *", "print(false*1);", /Expected a number/],
  ["bad types for /", "print(false/1);", /Expected a number/],
  ["bad types for **", "print(false**1);", /Expected a number/],
  ["bad types for <", "print(false<1);", /Expected a number or string/],
  ["bad types for <=", "print(false<=1);", /Expected a number or string/],
  ["bad types for >", "print(false>1);", /Expected a number or string/],
  ["bad types for >=", "print(false>=1);", /Expected a number or string/],
  ["bad types for ==", "print(2==2.0);", /not have the same type/],
  ["bad types for !=", "print(false!=1);", /not have the same type/],
  ["bad types for negation", "print(-true);", /Expected a number/],
  ["bad types for length", "print(#false);", /Expected an array/],
  ["bad types for not", 'print(!"hello");', /Expected a boolean/],
  ["non-integer index", "let a=[1];print(a[false]);", /Expected an integer/],
  ["diff type array elements", "print([3,3.0]);", /Not all elements have the same type/],
  ["shadowing", "let x = 1;\nwhile true {let x = 1;}", /Identifier x already declared/],
  ["call of uncallable", "let x = 1;\nprint(x());", /Call of non-function/],
  [
    "Too many args",
    "function f(x: int) {}\nf(1,2);",
    /1 argument\(s\) required but 2 passed/,
  ],
  [
    "Too few args",
    "function f(x: int) {}\nf();",
    /1 argument\(s\) required but 0 passed/,
  ],
  [
    "Parameter type mismatch",
    "function f(x: int) {}\nf(false);",
    /Cannot assign a boolean to a int/,
  ],
  [
    "function type mismatch",
    `function f(x: int, y: (boolean)->void): int { vote 1; }
     function g(z: boolean): int { vote 5; }
     f(2, g);`,
    /Cannot assign a \(boolean\)->int to a \(boolean\)->void/,
  ],
  ["bad param type in fn assign", "function f(x: int) {} function g(y: float) {} f = g;"],
  [
    "bad return type in fn assign",
    'task f(x: int): int {vote 1;} function g(y: int): string {vote "uh-oh";} f = g;',
    /Cannot assign a \(int\)->string to a \(int\)->int/,
  ],
  ["bad call to stdlib sin()", "print(sin(true));", /Cannot assign a boolean to a float/],
  ["Non-type in param", "let x=1;function f(y:x){}", /Type expected/],
  ["Non-type in return type", "let x=1;function f():x{vote 1;}", /Type expected/],
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
    const ast = analyze("print(1+2);")
    assert.equal(ast.statements[0].callee.name, "print")
    assert.equal(ast.statements[0].args[0].left, 1n)
  })
})
