/**
 * @license
 * Copyright 2021 Yonggang Wang
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
 * @fileoverview The interpreter of Meowlang.
 */

export const CAT_EMOJI = '🐈';

export const SEP_TOKEN = ';';

export const MEOW_TOKENS = {
  en: 'Meow',
  fr: 'Miaou',
  zh: '喵',
  py: 'Miao',
};

const MEOW_TOKENS_COMBINED = Object.values(MEOW_TOKENS).join('|');

const MEOW_TOKEN_REGEXP =
    new RegExp(`${MEOW_TOKENS_COMBINED}`, 'ig');

const MEOW_ELEMENT_REGEXP =
    new RegExp(`(${MEOW_TOKENS_COMBINED})*${SEP_TOKEN}`, 'ig');

const MEOW_PROGRAM_REGEXP =
    new RegExp(`^((${MEOW_TOKENS_COMBINED})*${SEP_TOKEN})*$`, 'ig');

/**
 * Runs a Meowlang program.
 * @param {string} code The program to be run.
 * @param {function(string)|undefined} reportErrorCallback The callback function
 *     to report an error message.
 * @param {function()|undefined} retCallback The callback function to execute
 *     the RET action.
 * @param {function()|undefined} meowCallback The callback function to execute
 *     the MEOW action.
 * @param {function(Object)|undefined} runtimeListener The callback function to
 *     listen to the runtime events.
 */
export function runMeowLang(code, reportErrorCallback,
    retCallback, meowCallback,
    runtimeListener) {
  const reportErrorFunc = getReportErrorFunc(reportErrorCallback);

  // Parses the code into the Meow List.
  let meowList = null;
  try {
    if (code.search(/[0-9]/) >= 0) {
      meowList = parseSimplified(code);
    } else {
      meowList = parseMeow(code);
    }
  } catch (err) {
    reportErrorFunc('Parser', err.message);
    return;
  }

  // Executes the Meow List.
  try {
    execute(meowList,
        retCallback,
        meowCallback,
        runtimeListener);
  } catch (err) {
    reportErrorFunc('Interpreter', err.message);
    return;
  }
}

/**
 * Parses a program in the Meow format.
 * @param {string} code The program.
 * @return {Array<number>} The Meow List.
 */
export function parseMeow(code) {
  code = removeWhiteSpaces(code);
  if (code.match(MEOW_PROGRAM_REGEXP) == null) {
    throw new Error('Invalid Meow format.');
  }
  const elements = code.match(MEOW_ELEMENT_REGEXP);
  if (elements == null) {
    return [];
  }
  const meowList = [];
  for (const element of elements) {
    const tokens = element.match(MEOW_TOKEN_REGEXP);
    const value = tokens == null ? 0 : tokens.length;
    meowList.push(value);
  }
  return meowList;
}

/**
 * Parses a program in the simplified Meow format.
 * @param {string} code The program.
 * @return {Array<number>} The Meow List.
 */
export function parseSimplified(code) {
  const lines = code.match(/[^\r\n]+/g);
  const meowList = [];
  for (const line of lines) {
    const token = removeWhiteSpaces(line);
    if (token.length <= 0) {
      continue;
    }
    if (!token.match(/^[0-9]+$/)) {
      throw new Error(`Invalid number "${token}."`);
    }
    meowList.push(parseInt(token));
  }
  return meowList;
}

/**
 * Gets the error reporting function.
 * @param {function(string)|undefined} reportErrorCallback The callback function
 *     to report an error message.
 * @return {function(string, string)}
 */
function getReportErrorFunc(reportErrorCallback) {
  return (module, message) => {
    const fullMessage = `Error: ${module} - ${message}`;
    if (reportErrorCallback != undefined) {
      reportErrorCallback(fullMessage);
    } else {
      console.error(fullMessage);
    }
  };
}

/**
 * Removes all the white spaces from a string.
 * @param {string} str
 * @return {string}
 */
function removeWhiteSpaces(str) {
  return str.replace(/\s+/g, '');
}

/**
 * Executes the instructions in a Meow List.
 * @param {Array<number>} meowList The Meow List.
 * @param {function()|undefined} retCallback The callback function to execute
 *     the RET action.
 * @param {function()|undefined} meowCallback The callback function to execute
 *     the MEOW action.
 * @param {function(Object)|undefined} runtimeListener The callback function to
 *     listen to the runtime events.
 */
function execute(meowList,
    retCallback, meowCallback, runtimeListener) {
  const undefinedOperand = () => undefined;
  const nextOperand = (ip, meowList) => {
    if (ip + 1 >= meowList.length) {
      throw new Error('Operand N is required.');
    }
    return meowList[ip + 1];
  };
  const checkIndex = (index, meowList) => {
    if (index < 0 || index >= meowList.length) {
      throw new Error(
          `Index "${index}" exceeds the number of list elements.`);
    }
  };
  const instructions = [
    {
      opname: 'RET',
      operand: undefinedOperand,
      action: (ip) => {
        if (retCallback != undefined) {
          retCallback();
        } else {
          console.log('');
        }
        return ip + 1;
      },
    },
    {
      opname: 'MEOW',
      operand: undefinedOperand,
      action: (ip) => {
        const tail = meowList[meowList.length - 1];
        for (let i = 0; i < tail; i++) {
          if (meowCallback != undefined) {
            meowCallback();
          } else {
            console.log(CAT_EMOJI);
          }
        }
        return ip + 1;
      },
    },
    {
      opname: 'PUSH',
      operand: nextOperand,
      action: (ip, meowList) => {
        const nOperand = nextOperand(ip, meowList);
        meowList.push(nOperand);
        return ip + 2;
      },
    },
    {
      opname: 'POP',
      operand: undefinedOperand,
      action: (ip, meowList) => {
        meowList.pop();
        return ip + 1;
      },
    },
    {
      opname: 'LOAD',
      operand: nextOperand,
      action: (ip, meowList) => {
        const nOperand = nextOperand(ip, meowList);
        checkIndex(nOperand, meowList);
        meowList.push(meowList[nOperand]);
        return ip + 2;
      },
    },
    {
      opname: 'SAVE',
      operand: nextOperand,
      action: (ip, meowList) => {
        const nOperand = nextOperand(ip, meowList);
        checkIndex(nOperand, meowList);
        const tail = meowList[meowList.length - 1];
        meowList[nOperand] = tail;
        return ip + 2;
      },
    },
    {
      opname: 'ADD',
      operand: undefinedOperand,
      action: (ip, meowList) => {
        const operand1 = meowList[meowList.length - 2];
        const operand2 = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        const result = operand1 + operand2;
        meowList.push(result);
        return ip + 1;
      },
    },
    {
      opname: 'SUB',
      operand: undefinedOperand,
      action: (ip, meowList) => {
        const operand1 = meowList[meowList.length - 2];
        const operand2 = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        const result = operand1 - operand2;
        meowList.push(result >= 0 ? result : 0);
        return ip + 1;
      },
    },
    {
      opname: 'JMP',
      operand: nextOperand,
      action: (ip, meowList) => {
        const offset = nextOperand(ip, meowList);
        checkIndex(offset, meowList);
        return offset;
      },
    },
    {
      opname: 'JE',
      operand: nextOperand,
      action: (ip, meowList) => {
        const offset = nextOperand(ip, meowList);
        checkIndex(offset, meowList);
        const tail = meowList[meowList.length - 1];
        return tail === 0 ? offset : ip + 2;
      },
    },
    {
      opname: 'NOP',
      operand: undefinedOperand,
      action: (ip) => {
        return ip + 1;
      },
    },
  ];

  let ip = 0;
  while (ip < meowList.length) {
    const opcode = meowList[ip];
    const instruction = opcode >= instructions.length ?
        instructions[instructions.length - 1] :
        instructions[opcode];
    if (runtimeListener != undefined) {
      runtimeListener({
        ip: ip,
        opcode: opcode,
        opname: instruction.opname,
        operand: instruction.operand(ip, meowList),
        meowList: meowList,
      });
    }
    ip = instruction.action(ip, meowList);
  }
  if (runtimeListener != undefined) {
    // Reports the final state after the last instruction is executed.
    runtimeListener({
      ip: undefined,
      opcode: undefined,
      opname: undefined,
      operand: undefined,
      meowList: meowList,
    });
  }
}
