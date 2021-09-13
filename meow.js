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
 * @fileoverview The command-line utility to execute a Meowlang code.
 */

import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {runMeowLang, CAT_EMOJI} from './meowlang.js';

/** @type {Object} */
const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      describe: 'The input file path',
    })
    .option('debug', {
      alias: 'd',
      type: 'boolean',
      description: 'Show debug info',
    })
    .argv;

if (argv.input) {
  const code = fs.readFileSync(argv.input, 'utf8');
  runMeowLang(
      code.toString(),
      (message) => {
        console.error(message);
      },
      () => {
        process.stdout.write('\n');
      },
      () => {
        process.stdout.write(`${CAT_EMOJI}`);
      },
      argv.debug ? (info) => {
        console.log(info);
      } : undefined);
}
