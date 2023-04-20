import assert from "assert/strict";
import util from "util";
import compile from "../src/compiler.js";

const sampleProgram = "report 0";

const testCases = [
  {
    name: "Sample program",
    source: "report 0",
    expected: "console.log(0);",
  },
  {
    name: "Simple addition",
    source: "report 3 + 5",
    expected: "console.log(3 + 5);",
  },
  {
    name: "Variable assignment and usage",
    source: "let x = 10\nreport x + 2",
    expected: "let x_1 = 10;\nconsole.log(x_1 + 2);",
  },
  {
    name: "Conditional statements",
    source: "if 3 > 2 { report 1 } else { report 0 }",
    expected: "if (3 > 2) { console.log(1); } else { console.log(0); }",
  },
  {
    name: "While loop",
    source: "let x = 0\nwhile x < 3 { report x\nx = x + 1 }",
    expected: "let x_1 = 0;\nwhile (x_1 < 3) { console.log(x_1); x_1 = x_1 + 1; }",
  },
  {
    name: "Function definition and call",
    source: "function add(a: int, b: int): int { return a + b }\nreport add(5, 3)",
    expected: "function add_1(a_2, b_3) { return a_2 + b_3; }\nconsole.log(add_1(5, 3));",
  },
];

describe("The compiler", () => {
  it("throws when the output type is unknown", (done) => {
    assert.throws(() => compile("report(0)", "blah"), /Unknown output type/);
    done();
  });

  it("accepts the analyzed option", (done) => {
    const compiled = compile(sampleProgram, "analyzed");
    assert(util.format(compiled).startsWith("   1 | Program"));
    done();
  });

  for (const testCase of testCases) {
    it(`correctly compiles the ${testCase.name} program`, () => {
      const actual = compile(testCase.source, "js");
      assert.strictEqual(actual.trim(), testCase.expected.trim());
    });
  }
});
