# meowlang

Meowlang is an esoteric programming language designed for cats.

## Usage

### Setup

```shell
yarn
```

### Command-line Interpreter

```shell
node . -i examples/hello.meow
```

```shell
node . -i examples/fibonacci.meow
```

### Web Application

```shell
yarn start
```

## Language Specification

### Meow List

A valid Meowlang program is simply a text representation of a Meow List.

A Meow List is a sequence of Meow elements.

Every Meow element contains zero or more Meow tokens. The number of Meow tokens
in a Meow element corresponds to a non-negative integer value, which is the
value of the Meow element.

A Meow element can be treated either as a Meow instruction or a Meow operand,
depending on the execution context:

* When a Meow element is treated as a Meow instruction, the value of the element
  is the opcode of the instruction.
* When a Meow element is treated as a Meow operand, the operand value is the
  value of the element.

In the Meowlang runtime, the loaded Meow List is a read/write list, which is
both a list of Meow instructions, and the only in-memory data structure that
Meow instructions can access.

In other words, code is data and data is code.

### Meow Tokens

A Meow token is a cat cry in plain text. The following Meow tokens are valid and
interchangeable in Meowlang programs.

* `Meow` in English
* `Miaou` in French
* `喵` in Chinese
* `Miao` in Chinese Pinyin

Meow tokens are case-insensitive. For example, `Meow`, `meow`, and `MEOW` are
the same things.

### Meow File Format

The text representation of a Meowlang program uses semicolon `";"` to end every
Meow element.

For example, the following code contains 5 Meow elements, whose values are 0, 1,
2, 3 and 4.

```text
;
Meow;
Meow Meow;
Meow Meow Meow;
Meow Meow Meow Meow;
```

White spaces including `" "`, `"\t"` and `"\n"` are used for formatting purposes
only, and will be ignored when the program is executed. You may layout your code
in many different and interesting ways. For example, the following code is an
equivalent representation of the above code:

```text
; M e o w ; MeowMeow ; MeowMeowMeow ; MeowMeowMeowMeow ;
```

The Meow tokens in the supported languages can be mixed up in a same program.
For example:

```text
;
喵;
Meow Miao;
Miaou Miaou Miaou;
Miaou 喵 Meow Miao;
```

The preferred file extension of the Meow file format is `".meow"`.

### Simplified Meow File Format

A Meow program can also be stored and loaded as a sequence of non-negative
integer numbers, each number corresponding to the value of a Meow element. For
example:

```text
0
1
2
3
4
```

The preferred file extension of the simplified Meow file format is `".smeow"`.

### Meow Instruction Set

| Opcode | Name | Description | `IP` Operation |
|--------|------|-------------|----------------|
| 0 | `RET` | Print an empty line `"\n"` to the output console. | `IP++` |
| 1 | `MEOW` | Print `T` cat emoji characters to the output console. | `IP++` |
| 2 | `PUSH` | Push `N` to the tail of the Meow List. | `IP += 2` |
| 3 | `POP` | Pop the tail element from the Meow List. | `IP++` |
| 4 | `LOAD` | Push the value of `E(N)` to the tail of the Meow List. | `IP += 2` |
| 5 | `SAVE` | Copy the value of the tail element to `E(N)`. | `IP += 2` |
| 6 | `ADD` | Add the values of the last two tail elements, pop them from the tail, then push the result to the tail. | `IP++` |
| 7 | `SUB` | Subtract the value of the last element from the value of the second to the last element, pop the last two elements from the tail, then push the result to the tail. If the result is negative, a zero is pushed. | `IP++` |
| 8 | `JMP` | Set `IP` to `N`. | `IP = N` |
| 9 | `JE` | If the value of the tail element is zero, set `IP` to `N`. Otherwise, continue to execute the next after the next instruction. | `IP = (T == 0) ? N : IP + 2` |
| >=10 | `NOP` | No operation. | `IP++` |

* `IP`: The Instruction Pointer.
* `T`: The value of the tail element.
* `N`: The value of the next element.
* `E(N)`: The element indexed by the value of the next element.
