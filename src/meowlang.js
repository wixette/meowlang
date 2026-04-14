// @ts-check
/**
 * @license
 * Copyright 2021-2026 Yonggang Wang
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Core interpreter for the Meowlang esoteric programming
 * language. This module is shared by the CLI entry point (meow.js), the
 * converter utility (smeow2meow.js), and the web-based demo app.
 *
 * Language overview
 * -----------------
 * A Meowlang program is a Meow List — a sequence of non-negative integer
 * values. Each value is written as a run of Meow tokens (one token = 1),
 * terminated by a semicolon. The integer value of each element is used both as
 * an instruction opcode and as addressable data, so code and data share the
 * same structure (self-modifying code is therefore possible).
 *
 * Two file formats are supported:
 *   .meow   — tokens + semicolons, e.g. "MeowMeow; Meow;"
 *   .smeow  — one integer per line,  e.g. "2\n1"
 */

/** The cat emoji printed by the MEOW instruction. */
export const CAT_EMOJI = '🐈';

/** ASCII semicolon — the element separator in the .meow format. */
export const SEP_TOKEN = ';';

/** Chinese fullwidth semicolon — accepted as an alternative separator. */
export const SEP_TOKEN_ZH = '；';

/**
 * All valid Meow tokens, keyed by language / variant.
 *
 * References:
 *   https://simple.wikipedia.org/wiki/Meow
 *
 * English has used several spellings historically (meow, miaow, meaw); the
 * others reflect standard onomatopoeia in their respective languages.
 *
 * @type {Readonly<Record<string, string>>}
 */
export const MEOW_TOKENS = Object.freeze({
  de: 'Miau',
  en_1: 'Meow',
  en_2: 'Miaow',
  en_3: 'Meaw',
  fr: 'Miaou',
  jp: 'ニャー',
  zh: '喵',
  zh_py: 'Miao',
  ru: 'Мяу',
});

// ─── Internal regex helpers ────────────────────────────────────────────────

const MEOW_TOKENS_COMBINED = Object.values(MEOW_TOKENS).join('|');

/** Matches a single Meow token (case-insensitive). */
const MEOW_TOKEN_REGEXP = new RegExp(`${MEOW_TOKENS_COMBINED}`, 'ig');

/** Matches one complete Meow element: zero or more tokens followed by ';'. */
const MEOW_ELEMENT_REGEXP =
    new RegExp(
        `(${MEOW_TOKENS_COMBINED})*(${SEP_TOKEN}|${SEP_TOKEN_ZH})`,
        'ig');

/** Matches a complete, valid Meowlang program in the .meow format. */
const MEOW_PROGRAM_REGEXP =
    new RegExp(
        `^((${MEOW_TOKENS_COMBINED})*(${SEP_TOKEN}|${SEP_TOKEN_ZH}))*$`,
        'ig');

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Runs a Meowlang program.
 *
 * The format (.meow or .smeow) is detected automatically: if the source
 * contains any ASCII digit the simplified format is assumed, otherwise the
 * Meow-token format is assumed.
 *
 * @param {string} code The source code to execute.
 * @param {((message: string) => void) | undefined} reportErrorCallback
 *     Called with a human-readable message when a parse or runtime error
 *     occurs. If omitted, errors are written to `console.error`.
 * @param {(() => void) | undefined} retCallback
 *     Called once for each RET instruction (opcode 0). Typically used to
 *     append a newline to the output. If omitted, `console.log('')` is used.
 * @param {(() => void) | undefined} meowCallback
 *     Called once per cat emoji for each MEOW instruction (opcode 1).
 *     Typically used to append a cat emoji to the output. If omitted,
 *     `console.log(CAT_EMOJI)` is used.
 * @param {((char: string) => void) | undefined} yowlCallback
 *     Called when a YOWL instruction (opcode 10) is executed.
 * @param {(() => Promise<number>) | undefined} sniffCallback
 *     Called when a SNIFF instruction (opcode 11) is executed.
 * @param {(() => void) | undefined} scratchCallback
 *     Called when a SCRATCH instruction (opcode 13) is executed.
 * @param {((info: RuntimeInfo) => void) | undefined} runtimeListener
 *     Called after every instruction with a snapshot of interpreter state.
 *     Also called once after the last instruction with `ip` set to
 *     `undefined` to signal program end. Pass `undefined` to disable.
 */
export async function runMeowLang(code, reportErrorCallback,
    retCallback, meowCallback,
    yowlCallback, sniffCallback, scratchCallback,
    runtimeListener) {
  const reportError = makeReportError(reportErrorCallback);

  /** @type {number[] | null} */
  let meowList = null;
  try {
    meowList = code.search(/[0-9]/) >= 0 ?
        parseSimplified(code) :
        parseMeow(code);
  } catch (err) {
    reportError('Parser', /** @type {Error} */ (err).message);
    return;
  }

  try {
    await execute(meowList, retCallback, meowCallback,
        yowlCallback, sniffCallback, scratchCallback,
        runtimeListener);
  } catch (err) {
    reportError('Interpreter', /** @type {Error} */ (err).message);
  }
}

/**
 * Parses a program in the .meow token format.
 *
 * Each element is a run of Meow tokens (any supported language, any mix)
 * terminated by a semicolon. Whitespace is ignored. Tokens are
 * case-insensitive.
 *
 * @param {string} code The source code.
 * @return {number[]} The parsed Meow List.
 * @throws {Error} If the source does not match the .meow format.
 */
export function parseMeow(code) {
  code = removeWhiteSpaces(code);
  if (code.match(MEOW_PROGRAM_REGEXP) == null) {
    throw new Error('Invalid Meow format.');
  }
  const elements = code.match(MEOW_ELEMENT_REGEXP);
  if (elements == null) return [];
  return elements.map((element) => {
    const tokens = element.match(MEOW_TOKEN_REGEXP);
    return tokens == null ? 0 : tokens.length;
  });
}

/**
 * Parses a program in the simplified .smeow format.
 *
 * Each non-empty line must contain exactly one non-negative integer, which
 * becomes the value of the corresponding Meow element. Blank lines are
 * ignored.
 *
 * @param {string} code The source code.
 * @return {number[]} The parsed Meow List.
 * @throws {Error} If any non-empty line contains a non-integer value.
 */
export function parseSimplified(code) {
  const lines = code.match(/[^\r\n]+/g) ?? [];
  /** @type {number[]} */
  const meowList = [];
  for (const line of lines) {
    const token = removeWhiteSpaces(line);
    if (token.length === 0) continue;
    if (!token.match(/^[0-9]+$/)) {
      throw new Error(`Invalid number "${token}."`);
    }
    meowList.push(parseInt(token, 10));
  }
  return meowList;
}

// ─── Runtime info type ─────────────────────────────────────────────────────

/**
 * @typedef {Object} RuntimeInfo
 * @property {number | undefined} ip
 *     The instruction pointer value before this step, or `undefined` after
 *     the final instruction has executed (signals program end).
 * @property {number | undefined} opcode The raw opcode value at `ip`.
 * @property {string | undefined} opname The symbolic name of the instruction.
 * @property {number | undefined} operand
 *     The value of the operand element (`ip + 1`), or `undefined` for
 *     instructions that take no operand.
 * @property {number[]} meowList
 *     A live reference to the Meow List at this point in execution.
 */

// ─── Private helpers ───────────────────────────────────────────────────────

/**
 * Returns an error-reporting function that delegates to the given callback,
 * or falls back to `console.error`.
 *
 * @param {((message: string) => void) | undefined} callback
 * @return {(module: string, message: string) => void}
 */
function makeReportError(callback) {
  return (module, message) => {
    const full = `Error: ${module} - ${message}`;
    if (callback != undefined) {
      callback(full);
    } else {
      console.error(full);
    }
  };
}

/**
 * Strips all whitespace characters from a string.
 *
 * @param {string} str
 * @return {string}
 */
function removeWhiteSpaces(str) {
  return str.replace(/\s+/g, '');
}

/**
 * Executes a parsed Meow List.
 *
 * @param {number[]} meowList The Meow List to execute (mutated in place by
 *     SAVE and growth from PUSH/LOAD).
 * @param {(() => void) | undefined} retCallback
 * @param {(() => void) | undefined} meowCallback
 * @param {((char: string) => void) | undefined} yowlCallback
 * @param {(() => Promise<number>) | undefined} sniffCallback
 * @param {(() => void) | undefined} scratchCallback
 * @param {((info: RuntimeInfo) => void) | undefined} runtimeListener
 */
async function execute(meowList, retCallback, meowCallback,
    yowlCallback, sniffCallback, scratchCallback,
    runtimeListener) {
  // Returns the value of the element immediately after `ip` (the operand).
  // Throws if that element does not exist.
  const nextOperand = (/** @type {number} */ ip) => {
    if (ip + 1 >= meowList.length) {
      throw new Error('Operand N is required.');
    }
    return meowList[ip + 1];
  };

  // Verifies that `index` is a valid Meow List index.
  const checkIndex = (/** @type {number} */ index) => {
    if (index < 0 || index >= meowList.length) {
      throw new Error(
          `Index "${index}" exceeds the number of list elements.`);
    }
  };

  // Helper for NAP (sleep) opcode.
  const sleep = (/** @type {number} */ ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  /**
   * @typedef {Object} Instruction
   * @property {string} opname
   * @property {(ip: number) => number | undefined} getOperand
   *     Returns the operand value for display, or undefined if none.
   * @property {(ip: number) => number | Promise<number>} action
   *     Executes the instruction and returns the next IP value.
   */

  /** @type {Instruction[]} */
  const instructions = [
    {
      // 0: RET — print a newline.
      opname: 'RET',
      getOperand: () => undefined,
      action: (ip) => {
        retCallback != undefined ? retCallback() : console.log('');
        return ip + 1;
      },
    },
    {
      // 1: MEOW — print T cat emojis (T = current tail value).
      opname: 'MEOW',
      getOperand: () => undefined,
      action: (ip) => {
        const tail = meowList[meowList.length - 1];
        for (let i = 0; i < tail; i++) {
          meowCallback != undefined ?
              meowCallback() :
              console.log(CAT_EMOJI);
        }
        return ip + 1;
      },
    },
    {
      // 2: PUSH N — push the value N to the tail of the Meow List.
      opname: 'PUSH',
      getOperand: (ip) => nextOperand(ip),
      action: (ip) => {
        meowList.push(nextOperand(ip));
        return ip + 2;
      },
    },
    {
      // 3: POP — remove the tail element from the Meow List.
      opname: 'POP',
      getOperand: () => undefined,
      action: (ip) => {
        meowList.pop();
        return ip + 1;
      },
    },
    {
      // 4: LOAD N — push a copy of E(N) to the tail.
      opname: 'LOAD',
      getOperand: (ip) => nextOperand(ip),
      action: (ip) => {
        const n = nextOperand(ip);
        checkIndex(n);
        meowList.push(meowList[n]);
        return ip + 2;
      },
    },
    {
      // 5: SAVE N — copy the tail value into E(N) (tail is not popped).
      opname: 'SAVE',
      getOperand: (ip) => nextOperand(ip),
      action: (ip) => {
        const n = nextOperand(ip);
        checkIndex(n);
        meowList[n] = meowList[meowList.length - 1];
        return ip + 2;
      },
    },
    {
      // 6: ADD — pop the last two elements, push their sum.
      opname: 'ADD',
      getOperand: () => undefined,
      action: (ip) => {
        const a = meowList[meowList.length - 2];
        const b = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        meowList.push(a + b);
        return ip + 1;
      },
    },
    {
      // 7: SUB — pop the last two elements, push (second-to-last − last),
      //          floored at 0 (no negative values in Meowlang).
      opname: 'SUB',
      getOperand: () => undefined,
      action: (ip) => {
        const a = meowList[meowList.length - 2];
        const b = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        meowList.push(a >= b ? a - b : 0);
        return ip + 1;
      },
    },
    {
      // 8: JMP N — set IP to N (unconditional jump).
      opname: 'JMP',
      getOperand: (ip) => nextOperand(ip),
      action: (ip) => {
        const n = nextOperand(ip);
        checkIndex(n);
        return n;
      },
    },
    {
      // 9: JE N — if the tail value is 0, set IP to N; otherwise IP += 2
      //           (skip the operand and continue with the next instruction).
      opname: 'JE',
      getOperand: (ip) => nextOperand(ip),
      action: (ip) => {
        const n = nextOperand(ip);
        checkIndex(n);
        return meowList[meowList.length - 1] === 0 ? n : ip + 2;
      },
    },
    {
      // 10: YOWL — ASCII Output. Pop tail and print char.
      opname: 'YOWL',
      getOperand: () => undefined,
      action: (ip) => {
        const val = meowList.pop() ?? 0;
        const char = String.fromCharCode(val);
        yowlCallback != undefined ? yowlCallback(char) : process.stdout.write(char);
        return ip + 1;
      },
    },
    {
      // 11: SNIFF — ASCII Input. Push input char ASCII code to tail.
      opname: 'SNIFF',
      getOperand: () => undefined,
      action: async (ip) => {
        const val = sniffCallback != undefined ? await sniffCallback() : 0;
        meowList.push(val);
        return ip + 1;
      },
    },
    {
      // 12: NAP N — Sleep. Pop tail and pause for N milliseconds.
      opname: 'NAP',
      getOperand: () => undefined,
      action: async (ip) => {
        const ms = meowList.pop() ?? 0;
        await sleep(ms);
        return ip + 1;
      },
    },
    {
      // 13: SCRATCH — Clear Screen.
      opname: 'SCRATCH',
      getOperand: () => undefined,
      action: (ip) => {
        scratchCallback != undefined ? scratchCallback() : console.clear();
        return ip + 1;
      },
    },
    {
      // ≥14: NOP — no operation.
      opname: 'NOP',
      getOperand: () => undefined,
      action: (ip) => ip + 1,
    },
  ];

  let ip = 0;
  while (ip < meowList.length) {
    const opcode = meowList[ip];
    // Opcodes ≥ instructions.length all map to NOP (the last entry).
    const instr = opcode < instructions.length ?
        instructions[opcode] :
        instructions[instructions.length - 1];

    if (runtimeListener != undefined) {
      runtimeListener({
        ip,
        opcode,
        opname: instr.opname,
        operand: instr.getOperand(ip),
        meowList,
      });
    }

    ip = await instr.action(ip);
  }

  // Final notification: signals that execution has ended.
  if (runtimeListener != undefined) {
    runtimeListener({
      ip: undefined,
      opcode: undefined,
      opname: undefined,
      operand: undefined,
      meowList,
    });
  }
}
