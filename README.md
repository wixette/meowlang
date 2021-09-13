# meowlang

Meowlang is an esoteric programming language designed for cats.

## Language Specification

### Source Code

A valid Meowlang source code is simply a group of Meow elements. Every Meow
element contains zero or more Meow tokens.

### Token Types

A valid Meowlang source code is composed of the following types of tokens:

* The Meow token: such as `Meow` in English, `喵` in Chinese, `Miaou` in French,
  etc. The Meow token is case-insensitive. E.g., `Meow`, `meow`, and `MEOW`
  are the same thing.
* The element ending token (semicolon): `";"`. The semicolon is used to end a
  Meow element, which is a group of Meow tokens. E.g., `Meow Meow;` is a group
  of two Meow tokens, and `;` is a group of zero Meow tokens.
* White spaces: " ", "\t" or "\n". All white spaces in the source code are used
  for formatting purposes only, and will be ignored when the source code is
  executed. E.g., `meow;meowmeow;`, `meow; meow meow ;`, and
  `\tmeow;  \t  meow\n m e o w ;` make no difference when being executed.

### Meowlist

In the runtime, a Meowlang source code itself is a read-write list, aka.,
`Meowlist`. The number of Meow tokens of every Meow element corresponds to a
non-negative integer number.

Depending on the execution context, every element in `Meowlist` can be treated
either as an instruction or as a non-negative number value. If an element is
treated as an instruction, the integer number of the element corresponds to the
instruction's opcode.

`Meowlist` is the only data structure that an Meow instruction can access. There
is no other in-memory structure (stack, heap, memory segment, etc.) in
Meowlang's runtime.

### Meow Instruction Set

| Opcode | Instruction Name | Description | `IP` Operation |
|--------|------|-------------|-----|
| 0 | Pause | Print a `\n` to the output console and pause for 0.5 sec. | +1 |
| 1 | Meow | Print a cat emoji to the output console and play the meow sound once. | +1 |
| 2 | PushI | Push `N` to the tail of `Meowlist`. | +2 |
| 3 | Push | Push `[N]` to the tail of `Meowlist`. | +2 |
| 4 | Pop | Pop the tail element from `Meowlist` | +1 |
| 5 | Top | Copy the number value of the tail element of `Meowlist` to `[N]`. | +2 |
| 6 | Add | Add the two tail elements and push the result number to the tail of `Meowlist`. | +1 |
| 7 | Sub | Subtract the two tail elements (subtract the last one from the second to the last one) and push the result number to the tail of `Meowlist`. 0 is pushed if the result is a negative value. | +1 |
| 8 | Jump | Jump to `[N]`. | Set `IP` to `N`. |
| 9 | JumpZ | If the value of the tail element is zero, jump to `[N]`. Otherwise, continue the execution. | Set `IP` to `N` if the tail element is zero. Otherwise, +2. |
| >=10 | Nop | No effect | No effect|

* IP Operation: How to deal with IP (the instruction pointer) after the
  instruction is executed.
* `N`: The number value of the next element of `Meowlist`.
* `[N]`: Addressing-by-index. The number value or the offset of the (N)th
  element of `Meowlist`.
