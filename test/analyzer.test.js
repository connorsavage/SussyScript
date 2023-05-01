import assert from "assert/strict"
import analyze from "../src/analyzer.js"

// Programs that are semantically correct
const semanticChecks = [
  ["variable declarations", 'constus x = 1 letus y = "false"'],
  ["short return", "task f() { vote }"],
  ["long return", "task f() { vote true }"],
  ["return in nested if", "task f() {sus true {vote}}"],
  ["break in nested if", "while false {if sus {break;}}"],
  ["long if", "if true {report 1;} else {report 3;}"],
  ["elsif", "if true {report 1;} else if true {report 0;} else {report 3;}"],
  ["for in range", "for i in 1..<10 {report 0;}"],
  ["repeat", "repeat 3 {let a = 1; report a;}"],
  ["conditionals with ints", "report true ? 8 : 5;"],
  //["conditionals with floats", "report 1<2 ? 8.0 : -5.22;"],
  ["conditionals with strings", 'report 1<2 ? "x" : "y";'],
  ["||", "report true||1<2||false||!true;"],
  ["&&", "report true&&1<2&&false&&!true;"],
  ["bit ops", "report (1&2)|(9^3);"],
  ["relations", 'report 1<=2 && "x">"y" && 3.5<1.2);'],
  //["ok to == arrays", "print([1]==[5,8]);"],
  //["ok to != arrays", "print([1]!=[5,8]);"],
  //["shifts", "print(1<<3<<5<<8>>2>>0);"],
  ["arithmetic", "let x=1;print(2*3+5**-3/2-5%8);"],
  //["array length", "print(#[1,2,3]);"],
  ["optional types", "let x = no int; x = some 100;"],
  ["variables", "let x=[[[[1]]]]; print(x[0][0][0][0]+2);"],
  ["recursive structs", "struct S {z: S?} let x = S(no S);"],
  ["nested structs", "struct T{y:int} struct S{z: T} let x=S(T(1)); print(x.z.y);"],
  ["member exp", "struct S {x: int} let y = S(1);print(y.x);"],
  //["optional member exp", "struct S {x: int} let y = some S(1);print(y?.x);"],
  ["subscript exp", "let a=[1,2];print(a[0]);"],
  //["array of struct", "struct S{} let x=[S(), S()];"],
  //["struct of arrays and opts", "struct S{x: [int] y: string??}"],
  ["assigned functions", "task f() {}\nlet g = f;g = f;"],
  ["call of assigned functions", "task f(x: int) {}\nlet g=f;g(1);"],
  //["type equivalence of nested arrays", "task f(x: [[int]]) {} print(f([[1],[2]]));"],
  [
    "call of assigned task in expression",
    `task f(x: int, y: boolean): int {}
    let g = f;
    print(g(1, true));
    f = g; // Type check here`,
  ],
  [
    "pass a function to a function",
    `task f(x: int, y: (boolean)->void): int { vote 1; }
     task g(z: boolean) {}
     f(2, g);`,
  ],
  [
    "function return types",
    `function square(x: int): int { vote x * x; }
     function compose(): (int)->int { vote square; }`,
  ],
  ["function assign", "function f() {} let g = f; let h = [g, f]; print(h[0]());"],
  ["struct parameters", "struct S {} function f(x: S) {}"],
  ["array parameters", "function f(x: [int?]) {}"],
  ["optional parameters", "function f(x: [int], y: string?) {}"],
  //["empty optional types", "print(no [int]); print(no string);"],
  //["types in function type", "function f(g: (int?, float)->string) {}"],
  ["voids in fn type", "function f(g: (void)->void) {}"],
  ["outer variable", "let x=1; while(false) {print(x);}"],
  ["built-in constants", "print(25.0 * π);"],
  ["built-in sin", "print(sin(π));"],
  ["built-in cos", "print(cos(93.999));"],
  ["built-in hypot", "print(hypot(-4.0, 3.00001));"],
]

// Programs that are syntactically correct but have semantic errors
const semanticErrors = [
  ["non-distinct fields", "struct S {x: boolean x: int}", /Fields must be distinct/],
  ["non-int increment", "let x=false;x++;", /an integer/],
  ["non-int decrement", 'let x=some[""];x++;', /an integer/],
  ["undeclared id", "print(x);", /Identifier x not declared/],
  ["redeclared id", "let x = 1;let x = 1;", /Identifier x already declared/],
  ["recursive struct", "struct S { x: int y: S }", /must not be recursive/],
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
  ["no such field", "struct S{} let x=S(); print(x.y);", /No such field/],
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
  ["Non-type in field type", "let x=1;struct S {y:x}", /Type expected/],
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
