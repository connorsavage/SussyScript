// Semantic analysis is done with the help of a context object, which roughly
// corresponds to lexical scopes in SussyScript. As SussyScript features static, nested
// scopes, each context contains not only a mapping of locally declared
// identifiers to their entities, but also a pointer to the static parent
// context. The root context, which contains the pre-declared identifiers and
// any globals, has a parent of null.

import fs from "fs"
import ohm from "ohm-js"
import * as core from "./core.js"

const sussyScriptGrammar = ohm.grammar(fs.readFileSync("src/sussyScript.ohm"))

const INT = core.Type.INT
const FLOAT = core.Type.FLOAT
const STRING = core.Type.STRING
const BOOLEAN = core.Type.BOOLEAN
const ANY = core.Type.ANY
const VOID = core.Type.VOID

// Throw an error message that takes advantage of Ohm's messaging
// function error(message, node) {
//   if (node) {
//     throw new Error(`${node.source.getLineAndColumnMessage()}${message}`)
//   }
//   throw new Error(message)
// }
function check(condition, message, node) {
  if (!condition) {
    //const prefix = node.at.source.getLineAndColumnMessage()
    throw new Error(`${message}`)
  }
}

class Context {
  constructor(parent = null) {
    this.parent = parent
    this.locals = new Map()
    this.inLoop = false
    this.function = null
  }

    add(name, entity) {
      this.locals.set(name, entity)
    }
    lookup(name) {
      return this.locals.get(name) || this.parent?.lookup(name)
    }
    newChildContext(props) {
      return new Context({ ...this, ...props, parent: this, locals: new Map() })
    }

  // add(name, entity, node) {
  //   check(!this.locals.has(name), `${name} has already been declared`, node)
  //   this.locals.set(name, entity)
  //   return entity
  // }
  get(name, expectedType, node) {
    let entity
    for (let context = this; context; context = context.parent) {
      entity = context.locals.get(name)
      if (entity) break
    }
    check(entity, `${name} has not been declared`, node)
    check(
      entity.constructor === expectedType,
      `${name} was expected to be a ${expectedType.name}`,
      node
    )
    return entity
  }
}

function mustHaveNumericType(e, at) {
  check([INT, FLOAT].includes(e.type), "Expected a number", at)
}
function mustHaveNumericOrStringType(e, at) {
  check(
    [INT, FLOAT, STRING].includes(e.type),
    "Expected a number or string",
    at
  )
}
function mustHaveBooleanType(e, at) {
  check(e.type === BOOLEAN, "Expected a boolean", at)
}
function mustHaveIntegerType(e, at) {
  check(e.type === INT, "Expected an integer", at)
}
function mustBeTheSameType(e1, e2, at) {
  check(equivalent(e1.type, e2.type), "Operands do not have the same type", at)
}
function mustHaveDistinctFields(type, at) {
  const fieldNames = new Set(type.fields.map((f) => f.name))
  must(fieldNames.size === type.fields.length, "Fields must be distinct", at)
}
function equivalent(t1, t2) {
  return (
    t1 === t2 ||
    (t1 instanceof core.OptionalType &&
      t2 instanceof core.OptionalType &&
      equivalent(t1.baseType, t2.baseType)) ||
    (t1 instanceof core.ArrayType &&
      t2 instanceof core.ArrayType &&
      equivalent(t1.baseType, t2.baseType)) ||
    (t1.constructor === core.FunctionType &&
      t2.constructor === core.FunctionType &&
      equivalent(t1.returnType, t2.returnType) &&
      t1.paramTypes.length === t2.paramTypes.length &&
      t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
  )
}
function mustNotBeReadOnly(e, at) {
  check(!e.readOnly, `Cannot assign to constant ${e.name}`, at)
}
function mustBeInLoop(context, at) {
  check(context.inLoop, "Break can only appear in a loop", at)
}

function mustBeInAFunction(context, at) {
  check(context.function, "Return can only appear in a function", at)
}
function mustNotReturnAnything(f, at) {
  check(f.type.returnType === VOID, "Something should be returned", at)
}

function mustReturnSomething(f, at) {
  check(
    f.type.returnType !== VOID,
    "Cannot return a value from this function",
    at
  )
}

export default function analyze(sourceCode) {
  let context = new Context()

  const analyzer = sussyScriptGrammar.createSemantics().addOperation("rep", {
    Program(body) {
      return new core.Program(body.children.map((s) => s.rep()))
    },
    Statement_vardec(modifier, id, _eq, initializer) {
      const e = initializer.rep()
      const readOnly = modifier.sourceString === "constus"
      const v = new core.Variable(id.sourceString, readOnly, e.type)
      context.add(id.sourceString, v)
      return new core.VariableDeclaration(v, e)
    },
    Statement_fundec(_fun, id, _open, params, _close, body) {
      params = params.asIteration().children
      const fun = new core.Function(id.sourceString, params.length, true)
      // Add the function to the context before analyzing the body, because
      // we want to allow functions to be recursive
      context.add(id.sourceString, fun, id)
      context = new Context(context)
      context.function = fun
      const paramsRep = params.map((p) => {
        let variable = new core.Variable(p.sourceString, true)
        context.add(p.sourceString, variable, p)
        return variable
      })
      const bodyRep = body.rep()
      context = context.parent
      return new core.FunctionDeclaration(fun, paramsRep, bodyRep)
    },
    Statement_assign(id, _eq, expression) {
      const target = id.rep()
      mustNotBeReadOnly(target)
      return new core.Assignment(target, expression.rep())
    },
    Statement_print(_print, argument) {
      return new core.PrintStatement(argument.rep())
    },
    Statement_return(_return, argument) {
      const e = argument.rep()
      const readOnly = _return.sourceString === "vote"
      context.add(_return.sourceString, readOnly)
      mustBeInAFunction(context, readOnly)
      return new core.ReturnStatement(readOnly, e)
    },
    Statement_shortreturn(_return) {
      const readOnly = _return.sourceString === "vote"
      context.add(_return.sourceString, readOnly)
      mustBeInAFunction(context)
      return new core.ShortReturnStatement(readOnly)
    },
    Statement_break(_break) {
      // const readOnly = _break.sourceString === "eject"
      // context.add(_break.sourceString, readOnly)
      mustBeInLoop(context)
      return new core.BreakStatement()
    },
    //if
    IfStmt_long(_if, test, consequent, _else, alternate) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep)
      const consequentRep = consequent.rep()
      const alternateRep = alternate.rep()
      return new core.IfStatement(testRep, consequentRep, alternateRep)
    },
    IfStmt_elsif(_if, test, consequent, _else, alternate) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep)
      const consequentRep = consequent.rep()
      // Do NOT make a new context for the alternate!
      const alternateRep = alternate.rep()
      return new core.IfStatement(testRep, consequentRep, alternateRep)
    },
    IfStmt_short(_if, test, consequent) {
      const testRep = test.rep()
      mustHaveBooleanType(testRep, test)
      const consequentRep = consequent.rep()
      return new core.ShortIfStatement(testRep, consequentRep)
    },
    //loops
    LoopStmt_while(_while, test, body) {
      const t = test.rep()
      const b = body.rep()
      mustHaveBooleanType(t)
      context = new Context()
      context.inLoop = true
      context = context.parent
      return new core.WhileStatement(t, b)
    },
    LoopStmt_repeat(_repeat, count, body) {
      const c = count.rep()
      mustHaveIntegerType(c)
      const b = body.rep()
      return new core.RepeatStatement(c, b)
    },
    LoopStmt_range(_for, id, _in, low, op, high, body) {
      const [x, y] = [low.rep(), high.rep()]
      mustHaveIntegerType(x)
      mustHaveIntegerType(y)
      const iterator = new core.Variable(id.sourceString, true)
      context.add(id.sourceString, iterator)
      const b = body.rep()
      return new core.ForRangeStatement(iterator, x, op.rep(), y, b)
    },
    Block(_open, body, _close) {
      return body.rep()
    },
    Exp_unary(op, operand) {
      const [o, x] = [op.sourceString, operand.rep()]
      let type
      if (o === "-") {
        mustHaveNumericType(x, { at: operand })
        type = x.type
      } else if (o === "!") {
        mustHaveBooleanType(x, { at: operand })
        type = BOOLEAN
      }
      return new core.UnaryExpression(o, x, type)
    },
    Exp_ternary(test, _questionMark, consequent, _colon, alternate) {
      const x = test.rep()
      mustHaveBooleanType(x)
      const [y, z] = [consequent.rep(), alternate.rep()]
      mustBeTheSameType(y, z)
      return new core.Conditional(x, y, z)
    },
    Exp1_binary(left, op, right) {
      let [x, o, y] = [left.rep(), op.rep(), right.rep()]
      mustHaveBooleanType(x)
      mustHaveBooleanType(y)
      return new core.BinaryExpression(o, x, y, BOOLEAN)
    },
    Exp2_binary(left, op, right) {
      let [x, o, y] = [left.rep(), op.rep(), right.rep()]
      mustHaveBooleanType(x)
      mustHaveBooleanType(y)
      return new core.BinaryExpression(o, x, y, BOOLEAN)
    },
    Exp3_binary(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      if (["<", "<=", ">", ">="].includes(op.sourceString))
        mustHaveNumericOrStringType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, BOOLEAN)
    },
    Exp4_binary(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      if (o === "+") {
        mustHaveNumericOrStringType(x)
      } else {
        mustHaveNumericType(x)
      }
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },
    Exp5_binary(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      mustHaveNumericType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },
    Exp6_binary(left, op, right) {
      const [x, o, y] = [left.rep(), op.sourceString, right.rep()]
      mustHaveNumericType(x)
      mustBeTheSameType(x, y)
      return new core.BinaryExpression(o, x, y, x.type)
    },
    Exp7_parens(_open, expression, _close) {
      return expression.rep()
    },
    Call(callee, left, args, _right) {
      const fun = context.get(callee.sourceString, core.Function, callee)
      const argsRep = args.asIteration().rep()
      check(
        argsRep.length === fun.paramCount,
        `Expected ${fun.paramCount} arg(s), found ${argsRep.length}`,
        left
      )
      return new core.Call(fun, argsRep)
    },
    id(_first, _rest) {
      const entity = context.lookup(id.sourceString)
      mustHaveBeenFound(entity, id.sourceString, { at: id })
      entityMustBeAType(entity, { at: id })
      // Designed to get here only for ids in expressions
      return context.get(this.sourceString, core.Variable, this)
    },
    true(_) {
      return true
    },
    false(_) {
      return false
    },
    num(_digits) {
      return BigInt(this.sourceString)
    },
    floatlit(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString)
    },
    _terminal() {
      return this.sourceString
    },
    _iter(...children) {
      return children.map((child) => child.rep())
    },
    strlit(_open, chars, _close) {
      return chars.sourceString
    },
    // IfStatement(s) {
    //   this.analyze(s.test)
    //   for (let i = 0; i < s.test.length; i++) {
    //     checkBoolean(s.test[i])
    //     this.newChildContext().analyze(s.consequent[i])
    //   }
    //   if (s.alternate.constructor === Array) {
    //     // It's a block of statements, make a new context
    //     this.newChildContext().analyze(s.alternate)
    //   }
    // },
  })

  for (const [name, entity] of Object.entries(core.standardLibrary)) {
    context.locals.set(name, entity)
  }
  const match = sussyScriptGrammar.match(sourceCode)
  if (!match.succeeded()) core.error(match.message)
  return analyzer(match).rep()
}
