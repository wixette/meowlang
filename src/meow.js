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

if (argv.input) {
  const code = fs.readFileSync(/** @type {string} */ (argv.input), 'utf8');
  (async () => {
    const wasRaw = process.stdin.isRaw;
    let rawModeSet = false;

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
        () => new Promise((resolve) => {
          // Enable raw mode on the first SNIFF and leave it on for the entire
          // program. Toggling raw mode per character creates a brief window
          // where the terminal re-enables local echo, causing typed characters
          // to appear doubled on screen alongside the YOWL output.
          if (!rawModeSet && process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
            rawModeSet = true;
          }
          process.stdin.once('data', (data) => {
            const byte = data[0];
            // Ctrl+C (byte 3) — no SIGINT in raw mode, so exit explicitly.
            if (byte === 3) {
              if (process.stdin.setRawMode) process.stdin.setRawMode(wasRaw);
              process.exit();
            }
            // Ctrl+D (byte 4) — EOF signal; resolve 0 so programs that loop
            // on SNIFF (like echo.meow) can exit cleanly.
            if (byte === 4) {
              resolve(0);
              return;
            }
            // Normalize CR (byte 13, the Enter key in raw mode) to LF (byte
            // 10). Without this, YOWL would write a bare carriage return that
            // snaps the cursor back to column 0 and overwrites prior output.
            resolve(byte === 13 ? 10 : byte);
          });
        }),
        () => {
          console.clear();
        },
        argv.debug ?
            (info) => {
              console.log(info);
            } :
            undefined);

    // Restore the original terminal mode after the program finishes.
    if (rawModeSet && process.stdin.setRawMode) {
      process.stdin.setRawMode(wasRaw);
    }
  })();
}
