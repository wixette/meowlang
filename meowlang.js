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
  let ip = 0;
  const INSTRUCTION_TABLE = [
    {
      opname: 'RET',
      operand: undefined,
      action: () => {
        if (pauseCallback != undefined) {
          pauseCallback();
        } else {
          console.log('');
        }
        ip++;
      }
    },
    {
      opname: 'MEOW',
      operand: undefined,
      action: () => {
        if (MeowCallback != undefined) {
          MeowCallback();
        } else {
          console.log(CAT_EMOJI);
        }
        ip++;
      }
    },
  ];
  while (ip < meowList.length) {
    const opcode = meowList[ip];
    const instruction = INSTRUCTION_TABLE[opcode];
    if (runtimeListener != undefined) {
      runtimeListener({
        ip: ip,
        opname: instruction.opname,
        operand: instruction.operand,
        meowList: meowList,
      });
    }
    instruction.action();
  }
  if (runtimeListener != undefined) {
    // Reports the state of the list after the last instruction is executed.
    runtimeListener({
      ip: undefined,
      opname: undefined,
      operand: undefined,
      meowList: meowList,
    });
  }
}
