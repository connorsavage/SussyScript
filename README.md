<img src=./docs/SussyScriptLogo.png width="500" height="500">

# [SussyScript](https://github.com/connorsavage/SussyScript)

Hello crewmates! We have some new tasks that we need to complete before the imposters get to us! These tasks requires the crew to do programming; fortunately, the admins just installed SussyScript to help with creating these sussy programs! SussyScript tasks should be easy to follow but also fun! Let's get to work so we can find out who is faking their tasks...

### Written by Mitchell Cootauco, Sebastian Cruz, Erin Hurlburt, and Connor Savage

### Imposterous Features:

- Mix of Python & Javascript: No parenthesis in if/while/for statements, but does have brackets
- Among Us-themed language and syntax
- Everything is natively private
- Static typing
- Object oriented
- Built-in data structures
- Objects are natively passed by copy for security
- varus (equivalent to Java's var) can be used for type inference
- String interpolation
- Suspicious but detailed error messages

### Sussy Types

<table>
  <tr>
    <th>Javascript Type</th>
    <th>Sussy Types</th>
  </tr>
  <tr>
    <td>boolean (true/false)</td>
    <td>sussy (crewmate/imposter)</td>
  </tr>
  <tr>
    <td>string</td>
    <td>comm</td>
  </tr>
  <tr>
    <td>Number</td>
    <td>intus</td>
  </tr>
  <tr>
    <td>Number</td>
    <td>doublus</td>
  </tr>
  <tr>
    <td>object</td>
    <td>admin</td>
  </tr>
</table>

### Sussy (Data) Structures

<table>
  <tr>
    <th>Data Structure</th>
    <th>Sussy Structures</th>
  </tr>
  <tr>
    <td>Array/List</td>
    <td>list</td>
  </tr>
  <tr>
    <td>Dictionary</td>
    <td>map</td>
  </tr>
</table>

## Example Tasks

### Hello World

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>

```javascript
console.log(“Hello world!”)
```

</td>

<td>

```
report “Hello world!”
```

</td>
</table>

### Assigning variables

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>

```javascript
var x = 0;
```

</td>

<td>

```
varus x = 0
intus x = 0
```

</td>
</table>

### if-statements

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
if (x < 10) {
  return 1;
} else if (x < 20) {
  return -1;
} else {
  return 0;
}
```
</td>
<td>
    
```
sus x < 10 {
  vote 1
} mega sus (x < 20) {
  vote -1
} mega {
  vote 0
} 
```
</td>
</table>

### Function Declarations

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
function evenOrOdd(x){
    return x %  2 ==  0
}
```
</td>
<td>
    
```
task evenOrOdd(intus x) -> sussy {
    vote x % 2 == 0
}
```
</td>
</table>

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
function add(a, b){
    return a + b;
}
```
</td>
<td>
    
```
task add(intus a, intus b) -> intus { 
   vote a + b
}
```
</td>
</table>

### Loops

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
while(true){
    break
}
```
</td>
<td>
    
```
is crewmate {
    eject
}
```
</td>
</table>

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
for (var x = 0; x < 3; x++) {
    break
}
```
</td>
<td>
    
```
scan varus x = 0 till 3 {
    eject
}
```
</td>
</table>

### Classes

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
class Rectangle {
    constructor(height, width){ 
        this.height = height;
        this.width = width;
    }
    getWidth() {
        return this.width
    }
    setWidth(newWidth) {
        this.width = newWidth
    }
}
let p = new Rectangle(3.0, 4);
console.log(p.getWidth())
p.setWidth(15)
```
</td>
<td>
    
```
role Rectangle {
    build (doublus h, intus w) {
        doublus thus.height = h
        intus thus.width = w
    }
    task getWidth() -> intus {
        vote thus.width
    }
    task setWidth(intus newWidth) -> none {
        thus.width = newWidth
    }
}
Rectangle p = new Rectangle(3.0, 4)
report p.getWidth()
p.setWidth(15)
```
</td>
</table>

### Data Skeletons Assignment

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td>
    
```javascript
let fruits = ['Apple', 'Banana']
```
</td>
<td>
    
```
varus fruits = ['Apple', 'Banana']
```
</td>
</table>

### Comments

<table>
<tr> <th>JavaScript</th><th>SussyScript</th><tr>
</tr>
<td> 
    
```javascript
// insert sussy comment
```
</td>
<td>
    
```
cR insert sussy comment
```
</td>
</table>
