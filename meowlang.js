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

const ERR_EMOJI = '👽';
const CAT_EMOJI = '🐈';

/**
 * Executes a Meowlang source code.
 * @param {string} code The source code
 * @param {function(string)|undefined} reportErrorCallback The callback function
 *     to report an error message.
 * @param {function()|undefined} pauseCallback The callback function to execute
 *     the PAUSE action.
 * @param {function()|undefined} MeowCallback The callback function to execute
 *     the MEOW action.
 * @param {function(Object)|undefined} runtimeListener The callback function to
 *     listen to the runtime events.
 */
export function runMeowLang(code, reportErrorCallback,
    pauseCallback, MeowCallback,
    runtimeListener) {
  const reportErrorFunc = getReportErrorFunc(reportErrorCallback);

  // Parses the code into the Meow List.
  let meowList = null;
  try {
    if (code.search(/[0-9]/) >= 0) {
      meowList = parseSimplifiedCode(code);
    } else {
      meowList = parseMeowCode(code);
    }
  } catch (err) {
    reportErrorFunc('Parser', err.message);
    return;
  }

  // Executes the Meow List.
  try {
    execute(meowList,
        pauseCallback,
        MeowCallback,
        runtimeListener);
  } catch (err) {
    reportErrorFunc('Interpreter', err.message);
    return;
  }
}

/**
 * Gets the error reporting function.
 * @param {function(string)|undefined} reportErrorCallback The callback function
 *     to report an error message.
 * @return {function(string, string)}
 */
function getReportErrorFunc(reportErrorCallback) {
  return (module, message) => {
    const fullMessage =
        `${ERR_EMOJI} ${module} ${ERR_EMOJI} ${message} ${ERR_EMOJI}`
    if (reportErrorCallback != undefined) {
      reportErrorCallback(fullMessage);
    } else {
      console.log(fullMessage);
    }
  }
}

/**
 * Parses a source code string in the simplified format.
 * @param {string} code The source code.
 * @return {Array<number>} The Meow List.
 */
function parseSimplifiedCode(code) {
  const lines = code.match(/[^\r\n]+/g);
  const list = [];
  for (const line of lines) {
    const token = removeWhiteSpaces(line);
    if (token.length <= 0) {
      continue;
    }
    if (!token.match(/^[0-9]+$/)) {
      throw new Error(`Invalid number "${token}"`);
    }
    list.push(parseInt(token));
  }
  return list;
}

/**
 * Parses a source code string in the simplified format.
 * @param {string} code The source code.
 * @return {Array<number>} The Meow List.
 */
function parseMeowCode(code) {
  throw new Error('Error in parsing');
}

/**
 * Removes all the white spaces from the string.
 * @param {string} str
 * @return {string}
 */
function removeWhiteSpaces(str) {
  return str.replace(/\s+/g);
}

/**
 * Executes the Meow List.
 * @param {Array<number>}
 * @param {function()|undefined} pauseCallback The callback function to execute
 *     the PAUSE action.
 * @param {function()|undefined} MeowCallback The callback function to execute
 *     the MEOW action.
 * @param {function(Object)|undefined} runtimeListener The callback function to
 *     listen to the runtime events.
 */
function execute(meowList,
    pauseCallback, MeowCallback, runtimeListener) {
  const UNDEFINED_OPERAND = () => undefined;
  const N_OPERAND = (ip, meowList) => {
    if (ip + 1 >= meowList.length) {
      throw new Error('N operand is not found.');
    }
    return meowList[ip + 1];
  };
  const INSTRUCTION_TABLE = [
    {
      opname: 'RET',
      operand: UNDEFINED_OPERAND,
      action: (ip) => {
        if (pauseCallback != undefined) {
          pauseCallback();
        } else {
          console.log('');
        }
        return ip + 1;
      }
    },
    {
      opname: 'MEOW',
      operand: UNDEFINED_OPERAND,
      action: (ip) => {
        if (MeowCallback != undefined) {
          MeowCallback();
        } else {
          console.log(CAT_EMOJI);
        }
        return ip + 1;
      }
    },
    {
      opname: 'PUSH',
      operand: N_OPERAND,
      action: (ip, meowList) => {
        const nOperand = N_OPERAND(ip, meowList);
        meowList.push(nOperand);
        return ip + 2;
      }
    },
    {
      opname: 'POP',
      operand: UNDEFINED_OPERAND,
      action: (ip, meowList) => {
        meowList.pop();
        return ip + 1;
      }
    },
    {
      opname: 'LOAD',
      operand: N_OPERAND,
      action: (ip, meowList) => {
        const nOperand = N_OPERAND(ip, meowList);
        if (nOperand < 0 || nOperand >= meowList.length) {
          throw new Error(
              'Index "${nOperand}" exceeds the number of list elements');
        }
        meowList.push(meowList[nOperand]);
        return ip + 2;
      }
    },
    {
      opname: 'SAVE',
      operand: N_OPERAND,
      action: (ip, meowList) => {
        const nOperand = N_OPERAND(ip, meowList);
        if (nOperand < 0 || nOperand >= meowList.length) {
          throw new Error(
              'Index "${nOperand}" exceeds the number of list elements');
        }
        const tail = meowList[meowList.length - 1];
        meowList[nOperand] = tail;
        return ip + 2;
      }
    },
    {
      opname: 'ADD',
      operand: UNDEFINED_OPERAND,
      action: (ip, meowList) => {
        const operand1 = meowList[meowList.length - 2];
        const operand2 = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        const result = operand1 + operand2;
        meowList.push(result);
        return ip + 1;
      }
    },
    {
      opname: 'SUB',
      operand: UNDEFINED_OPERAND,
      action: (ip, meowList) => {
        const operand1 = meowList[meowList.length - 2];
        const operand2 = meowList[meowList.length - 1];
        meowList.pop();
        meowList.pop();
        const result = operand1 - operand2;
        meowList.push(result >= 0 ? result : 0);
        return ip + 1;
      }
    },
    {
      opname: 'JE',
      operand: N_OPERAND,
      action: (ip, meowList) => {
        const offset = N_OPERAND(ip, meowList);
        if (offset < 0 || offset >= meowList.length - 1) {
          throw new Error(
              'Offset "${offset}" exceeds the number of list elements');
        }
        const tail = meowList.pop();
        return tail === 0 ? offset : ip + 2;
      }
    },
    {
      opname: 'NOP',
      operand: UNDEFINED_OPERAND,
      action: (ip) => {
        return ip + 1;
      }
    },
  ];

  let ip = 0;
  while (ip < meowList.length) {
    const opcode = meowList[ip];
    const instruction = opcode >= INSTRUCTION_TABLE.length ?
        INSTRUCTION_TABLE[INSTRUCTION_TABLE.length - 1] :
        INSTRUCTION_TABLE[opcode];
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
