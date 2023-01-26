import assert from "assert"
import {add } from "../src/SussyScript.js"

describe('The Compiler', () =>  {
    it("it gives the correct values for the add function", () => {
      assert.equal(add(5, 8), 13);
      assert.equal(add(5, -8), -3);
    });
});
