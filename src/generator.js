// CODE GENERATOR
//
// Invoke generate(program) with the program node to get back the JavaScript
// translation as a string.

import { IfStatement, Type, standardLibrary } from "./core.js"

export default function generate(program) {
  const output = []

  const standardFunctions = new Map([
    [standardLibrary.print, x => `console.log(${x})`],
    [standardLibrary.sin, x => `Math.sin(${x})`],
    [standardLibrary.cos, x => `Math.cos(${x})`],
    [standardLibrary.exp, x => `Math.exp(${x})`],
    [standardLibrary.ln, x => `Math.log(${x})`],
    [standardLibrary.hypot, ([x, y]) => `Math.hypot(${x},${y})`],
    [standardLibrary.bytes, s => `[...Buffer.from(${s}, "utf8")]`],
    [standardLibrary.codepoints, s => `[...(${s})].map(s=>s.codePointAt(0))`],
  ])

  // Variable and function names in JS will be suffixed with _1, _2, _3,
  // etc. This is because "switch", for example, is a legal name in Carlos,
  // but not in JS. So, the Carlos variable "switch" must become something
  // like "switch_1". We handle this by mapping each name to its suffix.
  const targetName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }
      return `${entity.name ?? entity.description}_${mapping.get(entity)}`
    }
  })(new Map())

  function gen(node) {
    return generators[node.constructor.name](node)
  }

  const generators = {
    // Key idea: when generating an expression, just return the JS string; when
    // generating a statement, write lines of translated JS to the output array.
    Program(p) {
      gen(p.statements)
    },

    VariableDeclaration(d) {
      // We don't care about const vs. let in the generated code! The analyzer has
      // already checked that we never updated a const, so let is always fine.
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`)
    },

    FunctionDeclaration(d) {
      output.push(`function ${gen(d.fun)}(${gen(d.params).join(", ")}) {`)
      gen(d.body)
      output.push("}")
    },
    Variable(v) {
      // Standard library constants just get special treatment
      if (v === standardLibrary.π) {
        return "Math.PI"
      }
      return targetName(v)
    },
    Function(f) {
      return targetName(f)
    },
    Assignment(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`)
    },
    BreakStatement(s) {
      output.push("break;")
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`)
    },
    ShortReturnStatement(s) {
      output.push("return;")
    },
    IfStatement(s) {
      output.push(`if (${gen(s.test)}) {`)
      gen(s.consequent)
      if (s.alternate instanceof IfStatement) {
        output.push("} else")
        gen(s.alternate)
      } else {
        output.push("} else {")
        gen(s.alternate)
        output.push("}")
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.test)}) {`)
      gen(s.consequent)
      output.push("}")
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.test)}) {`)
      gen(s.body)
      output.push("}")
    },
    RepeatStatement(s) {
      // JS can only repeat n times if you give it a counter variable!
      const i = targetName({ name: "i" })
      output.push(`for (let ${i} = 0; ${i} < ${gen(s.count)}; ${i}++) {`)
      gen(s.body)
      output.push("}")
    },
    ForRangeStatement(s) {
      const i = targetName(s.iterator)
      const op = s.op === "..." ? "<=" : "<"
      output.push(`for (let ${i} = ${gen(s.low)}; ${i} ${op} ${gen(s.high)}; ${i}++) {`)
      gen(s.body)
      output.push("}")
    },
    Conditional(e) {
      return `((${gen(e.test)}) ? (${gen(e.consequent)}) : (${gen(e.alternate)}))`
    },
    BinaryExpression(e) {
      const op = { "==": "===", "!=": "!==" }[e.op] ?? e.op
      return `(${gen(e.left)} ${op} ${gen(e.right)})`
    },
    UnaryExpression(e) {
      const operand = gen(e.operand)
      if (e.op === "some") {
        return operand
      } else if (e.op === "#") {
        return `${operand}.length`
      } else if (e.op === "random") {
        randomCalled = true
        return `_r(${operand})`
      }
      return `${e.op}(${operand})`
    },
    FunctionCall(c) {
      const targetCode = standardFunctions.has(c.callee)
        ? standardFunctions.get(c.callee)(gen(c.args))
        : `${gen(c.callee)}(${gen(c.args).join(", ")})`
      // Calls in expressions vs in statements are handled differently
      if (c.callee.type.returnType !== Type.VOID) {
        return targetCode
      }
      output.push(`${targetCode};`)
    },
    Number(e) {
      return e
    },
    BigInt(e) {
      return e
    },
    Boolean(e) {
      return e
    },
    String(e) {
      return e
    },
  }

  let randomCalled = false
  gen(program)
  if (randomCalled) output.push("function _r(a){return a[~~(Math.random()*a.length)]}")
  return output.join("\n")
}