function constantFoldBinaryExpression(node) {
  const left = constantFold(node.left);
  const right = constantFold(node.right);

  if (typeof left === "number" && typeof right === "number") {
    switch (node.op) {
      case "+":
        return left + right;
      case "-":
        return left - right;
      case "*":
        return left * right;
      case "/":
        return left / right;
      default:
        return {
          ...node,
          left,
          right,
        };
    }
  }

  return {
    ...node,
    left,
    right,
  };
}

function constantFold(node) {
  if (!node) {
    return node;
  }

  if (node.type === "BinaryExpression") {
    return constantFoldBinaryExpression(node);
  }

  return node;
}

export default function optimize(node) {
  return constantFold(node);
}