/**
 * @fileoverview Unit tests for the Meowlang core interpreter.
 *
 * Tests are organised into three suites:
 *   1. parseMeow        — .meow token-format parser
 *   2. parseSimplified  — .smeow integer-format parser
 *   3. runMeowLang      — execution engine (one sub-suite per opcode, plus
 *                         integration tests using the bundled example programs)
 */

import {describe, it, expect} from 'vitest';
import {
  parseMeow,
  parseSimplified,
  runMeowLang,
  CAT_EMOJI,
  SEP_TOKEN,
  MEOW_TOKENS,
} from '../src/meowlang.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Runs a Meowlang program (either format) and returns collected output.
 *
 * @param {string} code Source code in .meow or .smeow format.
 * @param {number} [sniffValue=0] The value to return for SNIFF.
 * @return {Promise<{ cats: string[], newlines: string[], errors: string[], yowls: string[], scratchedCount: number }>}
 */
async function run(code, sniffValue = 0) {
  /** @type {string[]} */ const cats = [];
  /** @type {string[]} */ const newlines = [];
  /** @type {string[]} */ const errors = [];
  /** @type {string[]} */ const yowls = [];
  let scratchedCount = 0;
  await runMeowLang(
      code,
      (e) => errors.push(e),
      () => newlines.push('\n'),
      () => cats.push(CAT_EMOJI),
      (char) => yowls.push(char),
      async () => sniffValue,
      () => { scratchedCount++; },
      undefined,
  );
  return {cats, newlines, errors, yowls, scratchedCount};
}

/**
 * Runs a program given as a Meow List (uses the .smeow format so integers
 * are passed through parseSimplified automatically).
 *
 * @param {number[]} list
 * @param {number} [sniffValue=0] The value to return for SNIFF.
 * @return {Promise<{ cats: string[], newlines: string[], errors: string[], yowls: string[], scratchedCount: number }>}
 */
async function runList(list, sniffValue = 0) {
  return await run(list.join('\n'), sniffValue);
}

// ─── parseMeow ───────────────────────────────────────────────────────────────

describe('parseMeow', () => {
  it('returns an empty list for empty input', () => {
    expect(parseMeow('')).toEqual([]);
  });

  it('parses a zero-value element (bare semicolon)', () => {
    expect(parseMeow(';')).toEqual([0]);
  });

  it('parses a single Meow token', () => {
    expect(parseMeow('Meow;')).toEqual([1]);
  });

  it('parses multiple Meow tokens in one element', () => {
    expect(parseMeow('MeowMeow;')).toEqual([2]);
    expect(parseMeow('MeowMeowMeow;')).toEqual([3]);
  });

  it('ignores whitespace between tokens', () => {
    expect(parseMeow('Meow Meow;')).toEqual([2]);
    expect(parseMeow('Meow\tMeow\nMeow;')).toEqual([3]);
  });

  it('is case-insensitive', () => {
    expect(parseMeow('meow;')).toEqual([1]);
    expect(parseMeow('MEOW;')).toEqual([1]);
    expect(parseMeow('mEoW mEoW;')).toEqual([2]);
  });

  it('accepts all supported language tokens', () => {
    // Each token represents value 1.
    const tokenTests = [
      ['en_1', 'Meow'],
      ['en_2', 'Miaow'],
      ['en_3', 'Meaw'],
      ['fr', 'Miaou'],
      ['de', 'Miau'],
      ['zh', '喵'],
      ['zh_py', 'Miao'],
      ['jp', 'ニャー'],
      ['ru', 'Мяу'],
    ];
    for (const [lang, token] of tokenTests) {
      expect(parseMeow(`${token};`), `lang=${lang}`).toEqual([1]);
    }
  });

  it('allows mixed tokens within one element', () => {
    expect(parseMeow('Meow喵Miau;')).toEqual([3]);
    expect(parseMeow('Miaou ニャー Мяу;')).toEqual([3]);
  });

  it('parses multiple elements', () => {
    expect(parseMeow(';Meow;MeowMeow;')).toEqual([0, 1, 2]);
  });

  it('accepts the Chinese fullwidth semicolon as separator', () => {
    expect(parseMeow('Meow；')).toEqual([1]);
    expect(parseMeow('喵；喵喵；')).toEqual([1, 2]);
  });

  it('accepts mixed ASCII and fullwidth semicolons', () => {
    expect(parseMeow('Meow;喵；')).toEqual([1, 1]);
  });

  it('throws on input that is not a valid .meow program', () => {
    expect(() => parseMeow('hello')).toThrow('Invalid Meow format.');
    // A token with no terminating semicolon is invalid.
    expect(() => parseMeow('Meow')).toThrow('Invalid Meow format.');
  });
});

// ─── parseSimplified ─────────────────────────────────────────────────────────

describe('parseSimplified', () => {
  it('parses a sequence of integers', () => {
    expect(parseSimplified('0\n1\n2\n')).toEqual([0, 1, 2]);
  });

  it('parses a single integer', () => {
    expect(parseSimplified('42\n')).toEqual([42]);
  });

  it('ignores blank lines', () => {
    expect(parseSimplified('0\n\n1\n\n2\n')).toEqual([0, 1, 2]);
  });

  it('handles Windows (CRLF) line endings', () => {
    expect(parseSimplified('0\r\n1\r\n2\r\n')).toEqual([0, 1, 2]);
  });

  it('handles leading/trailing whitespace on lines', () => {
    expect(parseSimplified('  3  \n  7  \n')).toEqual([3, 7]);
  });

  it('returns an empty list for blank input', () => {
    expect(parseSimplified('\n\n')).toEqual([]);
  });

  it('throws for non-numeric non-empty lines', () => {
    expect(() => parseSimplified('1\nabc\n3')).toThrow();
    expect(() => parseSimplified('1\n-1\n')).toThrow();
  });
});

// ─── runMeowLang — individual opcodes ────────────────────────────────────────

describe('runMeowLang — opcodes', () => {
  // ── RET (0) ──────────────────────────────────────────────────────────────
  it('RET (0): calls retCallback once', async () => {
    // Program: [0] — a single RET instruction.
    const {newlines, cats} = await runList([0]);
    expect(newlines).toHaveLength(1);
    expect(cats).toHaveLength(0);
  });

  it('RET (0): multiple RET instructions each call retCallback', async () => {
    // [0, 0, 0] — three RET instructions.
    const {newlines} = await runList([0, 0, 0]);
    expect(newlines).toHaveLength(3);
  });

  // ── MEOW (1) ─────────────────────────────────────────────────────────────
  it('MEOW (1): prints T cat emojis where T is the tail value', async () => {
    // PUSH 4, MEOW — tail is 4 so 4 cats are printed.
    const {cats, newlines} = await runList([2, 4, 1]);
    expect(cats).toHaveLength(4);
    expect(newlines).toHaveLength(0);
  });

  it('MEOW (1): prints 0 cats when tail is 0', async () => {
    // PUSH 0, MEOW — tail is 0.
    const {cats} = await runList([2, 0, 1]);
    expect(cats).toHaveLength(0);
  });

  // ── PUSH (2) ─────────────────────────────────────────────────────────────
  it('PUSH (2): pushes operand N onto the tail', async () => {
    // PUSH 7, MEOW — should see 7 cats.
    const {cats} = await runList([2, 7, 1]);
    expect(cats).toHaveLength(7);
  });

  // ── POP (3) ──────────────────────────────────────────────────────────────
  it('POP (3): removes the tail element', async () => {
    // PUSH 9, POP, PUSH 2, MEOW — after POP the 9 is gone; MEOW uses 2.
    const {cats} = await runList([2, 9, 3, 2, 2, 1]);
    expect(cats).toHaveLength(2);
  });

  // ── LOAD (4) ─────────────────────────────────────────────────────────────
  it('LOAD (4): pushes a copy of E(N) onto the tail', async () => {
    // [8, 4, 6, 10, 4, 2, 1]
    // JMP→4, data:6, NOP, LOAD[2](=6), MEOW → 6 cats.
    const {cats} = await runList([8, 4, 6, 10, 4, 2, 1]);
    expect(cats).toHaveLength(6);
  });

  it('LOAD (4): does not remove the source element', async () => {
    // Load the same element twice; total cats = 5 + 5 = 10.
    // [8, 4, 5, 10, 4, 2, 1, 4, 2, 1]
    // JMP→4, data:5, NOP, LOAD[2], MEOW, LOAD[2], MEOW.
    const {cats} = await runList([8, 4, 5, 10, 4, 2, 1, 4, 2, 1]);
    expect(cats).toHaveLength(10);
  });

  // ── SAVE (5) ─────────────────────────────────────────────────────────────
  it('SAVE (5): copies tail value into E(N) without popping', async () => {
    // PUSH 7, SAVE→[3], POP, LOAD[3], MEOW — loads the saved value 7.
    // [2, 7, 5, 3, 3, 4, 3, 1]
    const {cats} = await runList([2, 7, 5, 3, 3, 4, 3, 1]);
    expect(cats).toHaveLength(7);
  });

  it('SAVE (5): overwrites an existing value at the target index', async () => {
    // JMP→4, data:1, NOP, PUSH 9, SAVE→[2], POP, LOAD[2], MEOW.
    // After SAVE, E(2) changes from 1 to 9 → 9 cats.
    // [8, 4, 1, 10, 2, 9, 5, 2, 3, 4, 2, 1]
    const {cats} = await runList([8, 4, 1, 10, 2, 9, 5, 2, 3, 4, 2, 1]);
    expect(cats).toHaveLength(9);
  });

  // ── ADD (6) ──────────────────────────────────────────────────────────────
  it('ADD (6): pops two elements and pushes their sum', async () => {
    // PUSH 3, PUSH 4, ADD, MEOW → 7 cats.
    const {cats} = await runList([2, 3, 2, 4, 6, 1]);
    expect(cats).toHaveLength(7);
  });

  it('ADD (6): adding zero leaves the other value unchanged', async () => {
    const {cats} = await runList([2, 5, 2, 0, 6, 1]);
    expect(cats).toHaveLength(5);
  });

  // ── SUB (7) ──────────────────────────────────────────────────────────────
  it('SUB (7): computes second-to-last minus last', async () => {
    // PUSH 8, PUSH 3, SUB → 5, MEOW → 5 cats.
    const {cats} = await runList([2, 8, 2, 3, 7, 1]);
    expect(cats).toHaveLength(5);
  });

  it('SUB (7): floors at 0 for negative results', async () => {
    // PUSH 2, PUSH 9, SUB → max(2-9, 0) = 0, MEOW → 0 cats.
    const {cats} = await runList([2, 2, 2, 9, 7, 1]);
    expect(cats).toHaveLength(0);
  });

  it('SUB (7): 0 minus 0 equals 0', async () => {
    const {cats} = await runList([2, 0, 2, 0, 7, 1]);
    expect(cats).toHaveLength(0);
  });

  // ── JMP (8) ──────────────────────────────────────────────────────────────
  it('JMP (8): jumps unconditionally, skipping elements in between', async () => {
    // [8, 4, 0, 10, 2, 1, 1, 3, 0]
    // JMP→4 skips the RET at [2]; PUSH 1, MEOW, POP, RET.
    // Without JMP we'd get 2 newlines (from [2] and [8]); with JMP, 1.
    const {newlines, cats} = await runList([8, 4, 0, 10, 2, 1, 1, 3, 0]);
    expect(newlines).toHaveLength(1);
    expect(cats).toHaveLength(1);
  });

  // ── JE (9) ───────────────────────────────────────────────────────────────
  it('JE (9): jumps to N when tail is 0', async () => {
    // PUSH 0 → JE→5 (taken, T=0) → POP → PUSH 2 → MEOW → POP
    // RET at [4] is skipped entirely. Two cleanup POPs keep the stack balanced.
    const {newlines, cats} = await runList([2, 0, 9, 5, 0, 3, 2, 2, 1, 3]);
    expect(newlines).toHaveLength(0); // RET at [4] was skipped
    expect(cats).toHaveLength(2);
  });

  it('JE (9): does not jump when tail is non-zero', async () => {
    // PUSH 1 → JE→5 (not taken, T=1) → RET → POP → PUSH 2 → MEOW → POP
    // JE does not jump; RET executes. Two cleanup POPs keep the stack balanced.
    const {newlines, cats} = await runList([2, 1, 9, 5, 0, 3, 2, 2, 1, 3]);
    expect(newlines).toHaveLength(1); // RET was executed
    expect(cats).toHaveLength(2);
  });

  // ── NOP (≥14) ────────────────────────────────────────────────────────────
  it('NOP (≥14): produces no output for any value ≥ 14', async () => {
    const {cats, newlines} = await runList([14, 15, 99, 1000]);
    expect(cats).toHaveLength(0);
    expect(newlines).toHaveLength(0);
  });
});

describe('runMeowLang — 0.4.0 opcodes', () => {
  // ── YOWL (10) ────────────────────────────────────────────────────────────
  it('YOWL (10): prints one character from the tail value', async () => {
    // PUSH 65 ('A'), YOWL.
    const {yowls} = await runList([2, 65, 10]);
    expect(yowls).toEqual(['A']);
  });

  // ── SNIFF (11) ───────────────────────────────────────────────────────────
  it('SNIFF (11): pushes the input character value onto the tail', async () => {
    // SNIFF (returns 42), MEOW.
    const {cats} = await runList([11, 1], 42);
    expect(cats).toHaveLength(42);
  });

  // ── NAP (12) ─────────────────────────────────────────────────────────────
  it('NAP (12): pauses execution for T milliseconds', async () => {
    const start = Date.now();
    // PUSH 50, NAP.
    await runList([2, 50, 12]);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(45); // allowing a small margin
  });

  // ── SCRATCH (13) ─────────────────────────────────────────────────────────
  it('SCRATCH (13): calls scratchCallback', async () => {
    const {scratchedCount} = await runList([13, 13, 13]);
    expect(scratchedCount).toBe(3);
  });
});

// ─── runMeowLang — error handling ────────────────────────────────────────────

describe('runMeowLang — error handling', () => {
  it('reports a parser error for invalid .meow source', async () => {
    const {errors} = await run('this is not a meow program!!!');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Parser/);
  });

  it('reports a runtime error when an operand index is out of bounds', async () => {
    // LOAD with an index that exceeds the list length.
    const {errors} = await runList([4, 99]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Interpreter/);
  });

  it('reports a runtime error when PUSH/LOAD has no operand', async () => {
    // PUSH with no following element.
    const {errors} = await runList([2]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Interpreter/);
  });

  it('runs silently and produces no output for an empty program', async () => {
    const {cats, newlines, errors} = await run('');
    expect(cats).toHaveLength(0);
    expect(newlines).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});

// ─── runMeowLang — runtimeListener ───────────────────────────────────────────

describe('runMeowLang — runtimeListener', () => {
  it('receives one event per instruction plus a final end event', async () => {
    /** @type {import('../src/meowlang.js').RuntimeInfo[]} */
    const events = [];
    await runMeowLang(
        '0\n0\n', // two RET instructions
        undefined, undefined, undefined,
        undefined, undefined, undefined,
        (info) => events.push(info),
    );
    // 2 instruction events + 1 end event (ip === undefined).
    expect(events).toHaveLength(3);
    expect(events[0].opname).toBe('RET');
    expect(events[1].opname).toBe('RET');
    expect(events[2].ip).toBeUndefined();
  });

  it('reports correct opcode and opname for each instruction', async () => {
    /** @type {import('../src/meowlang.js').RuntimeInfo[]} */
    const events = [];
    await runMeowLang(
        '2\n3\n1\n', // PUSH 3, MEOW
        undefined, undefined, undefined,
        undefined, undefined, undefined,
        (info) => events.push(info),
    );
    expect(events[0].opname).toBe('PUSH');
    expect(events[0].opcode).toBe(2);
    expect(events[0].operand).toBe(3);
    expect(events[1].opname).toBe('MEOW');
    expect(events[1].operand).toBeUndefined();
  });
});

// ─── runMeowLang — example programs (integration) ────────────────────────────

describe('runMeowLang — example programs', () => {
  it('hello: prints exactly 3 cat emojis, no newlines', async () => {
    // hello.smeow = [1, 1, 1]: three MEOW instructions with tail value 1 each.
    const {cats, newlines} = await runList([1, 1, 1]);
    expect(cats).toHaveLength(3);
    expect(newlines).toHaveLength(0);
  });

  it('cat: prints 20 cat emojis followed by one newline', async () => {
    // cat.smeow = [2, 20, 1, 3, 0]: PUSH 20, MEOW, POP, RET.
    const {cats, newlines} = await runList([2, 20, 1, 3, 0]);
    expect(cats).toHaveLength(20);
    expect(newlines).toHaveLength(1);
  });

  it('sum: pushes 5+5, prints 10 cats, then a newline', async () => {
    // sum.smeow = [2, 5, 2, 5, 6, 1, 3, 0].
    const {cats, newlines} = await runList([2, 5, 2, 5, 6, 1, 3, 0]);
    expect(cats).toHaveLength(10);
    expect(newlines).toHaveLength(1);
  });

  it('countdown: prints 10 lines with 10, 9, … 1 cats each', async () => {
    // countdown.smeow = [8,3,10,4,2,1,0,2,1,7,5,2,9,17,3,8,3,3,10].
    const {cats, newlines} = await runList(
        [8, 3, 10, 4, 2, 1, 0, 2, 1, 7, 5, 2, 9, 17, 3, 8, 3, 3, 10]);
    // Lines 10, 9, 8, … 1 → total cats = 10+9+…+1 = 55.
    expect(cats).toHaveLength(55);
    expect(newlines).toHaveLength(10);
  });

  it('fibonacci: generates correct Fibonacci sequence for the first 10 terms',
      async () => {
        // fibonacci.smeow content from examples/.
        const fibSmeow = [
          8, 4, 1, 1, 2, 10, 4, 2, 1, 0, 3, 4, 2, 4, 3, 6, 4,
          3, 5, 2, 3, 5, 3, 3, 2, 1, 7, 9, 31, 8, 6, 3, 10,
        ];
        const {cats, newlines} = await runList(fibSmeow);
        // Fibonacci: 1,1,2,3,5,8,13,21,34,55 — sum = 143 cats total.
        expect(cats).toHaveLength(143);
        expect(newlines).toHaveLength(10);
      });
});

// ─── Token and separator constants ───────────────────────────────────────────

describe('exported constants', () => {
  it('CAT_EMOJI is the expected cat emoji', () => {
    expect(CAT_EMOJI).toBe('🐈');
  });

  it('SEP_TOKEN is a semicolon', () => {
    expect(SEP_TOKEN).toBe(';');
  });

  it('MEOW_TOKENS is frozen and contains all nine language keys', () => {
    expect(Object.isFrozen(MEOW_TOKENS)).toBe(true);
    const keys = Object.keys(MEOW_TOKENS);
    expect(keys).toContain('en_1');
    expect(keys).toContain('en_2');
    expect(keys).toContain('en_3');
    expect(keys).toContain('fr');
    expect(keys).toContain('de');
    expect(keys).toContain('zh');
    expect(keys).toContain('zh_py');
    expect(keys).toContain('jp');
    expect(keys).toContain('ru');
    expect(keys).toHaveLength(9);
  });

  it('smeow2meow: default lang en_1 maps to "Meow"', () => {
    expect(MEOW_TOKENS['en_1']).toBe('Meow');
  });
});
