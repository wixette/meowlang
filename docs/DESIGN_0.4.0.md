# MeowLang 0.4.0 Design Document: The Sensory & Vitality Update

This document outlines the architectural changes and new features for MeowLang version 0.4.0. The goal of this update is to evolve MeowLang from a pure emoji-printer into a Turing-complete language with standard I/O and timing capabilities, while maintaining strict backward compatibility with version 0.3.0.

## 1. Vision
MeowLang 0.4.0 introduces the concept of **Cat Senses**. A Meow program should be able to "Sniff" the environment (input), "Yowl" at the human (output), "Nap" (timing), and "Scratch" away the old state (UI refresh).

## 2. New Opcodes

| Opcode | Mnemonic | Cat Behavior | Technical Description |
| :--- | :--- | :--- | :--- |
| **10** | **YOWL** | A loud sound directed at humans. | **ASCII Output**: Pops the tail value and prints the corresponding ASCII character to standard output. |
| **11** | **SNIFF** | Detecting a scent from the environment. | **ASCII Input**: Reads one character from standard input and pushes its ASCII/Unicode value to the tail of the Meow List. Pushes `0` if no input is available or EOF is reached. |
| **12** | **NAP** | A cat's rest. | **Sleep/Delay**: Pops the tail value and pauses execution for that many milliseconds. |
| **13** | **SCRATCH** | Cleaning the territory. | **Clear Screen**: Triggers a "Clear Screen" command for the terminal or web output area. |

## 3. Backward Compatibility
- **Opcodes 0-9**: Behaviors remain identical to version 0.3.0.
- **Opcode >= 14**: Reserved for future use; currently treated as NOP.
- **Interoperability**: Programs written for 0.3.0 will run without modification on a 0.4.0 interpreter. Programs using 0.4.0 opcodes will run on a 0.3.0 interpreter but will skip the new behaviors (as 0.3.0 treats opcode >= 10 as NOP).

## 4. Interpreter Architectural Changes
To support the `NAP` (delay) instruction, the core `execute` function in `meowlang.js` must be refactored from synchronous to **asynchronous** (`async/await`).

### 4.1 New Callbacks
The `runMeowLang` function will be updated to support three new optional callbacks:
- `yowlCallback(char: string)`: Called when a `YOWL` instruction is executed.
- `sniffCallback(): Promise<number>`: Called when a `SNIFF` instruction is executed. Returns the ASCII code.
- `scratchCallback()`: Called when a `SCRATCH` instruction is executed.

## 5. User Interface (Web)
The web interpreter will be updated to:
- Render ASCII characters from `YOWL` in a dedicated or shared output area.
- Provide a way to handle `SNIFF` (e.g., a non-blocking input buffer or a simple `prompt`).
- Clear the output area when `SCRATCH` is called.

## 6. Examples
Three new example files will be provided to demonstrate 0.4.0 features:
1. `hello_ascii.meow`: Prints "Hello, World!" using `YOWL`.
2. `echo.meow`: Continuously `SNIFF`s and `YOWL`s back to the human.
3. `timer.meow`: Demonstrates `NAP` by counting down with a 1-second delay between numbers.
