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
 * @fileoverview Command-line interpreter for Meowlang.
 *
 * Usage:
 *   node . -i <file.meow>          Run a Meowlang program
 *   node . -i <file.meow> -d       Run with debug output
 */

import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {runMeowLang, CAT_EMOJI} from './meowlang.js';

const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      describe: 'The input .meow or .smeow file path',
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      describe: 'Print interpreter state after each instruction',
    })
    .argv;

/**
 * Creates a sniff callback that reads a single character from stdin.
 * @return {() => Promise<number>}
 */
function makeSniffCallback() {
  return () => new Promise((resolve) => {
    // We want to read exactly one character.
    // Node's stdin in raw mode is better for this.
    const wasRaw = process.stdin.isRaw;
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
    process.stdin.once('data', (data) => {
      if (process.stdin.setRawMode) {
        process.stdin.setRawMode(wasRaw);
      }
      // If Ctrl+C, exit.
      if (data[0] === 3) {
        process.exit();
      }
      resolve(data[0]);
    });
  });
}

if (argv.input) {
  const code = fs.readFileSync(/** @type {string} */ (argv.input), 'utf8');
  (async () => {
    await runMeowLang(
        code,
        (message) => {
          console.error(message);
        },
        () => {
          process.stdout.write('\n');
        },
        () => {
          process.stdout.write(CAT_EMOJI);
        },
        (char) => {
          process.stdout.write(char);
        },
        makeSniffCallback(),
        () => {
          console.clear();
        },
        argv.debug ?
            (info) => {
              console.log(info);
            } :
            undefined);
  })();
}
