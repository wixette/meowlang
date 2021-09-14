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
 * @fileoverview The command-line utility to convert a .smeow file to a .meow
 * file.
 */

import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {parseSimplified, MEOW_TOKENS, SEP_TOKEN} from './meowlang.js';

/** @type {Object} */
const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      describe: 'The input file path',
    })
    .option('lang', {
      alias: 'l',
      type: 'string',
      choices: Object.keys(MEOW_TOKENS),
      default: 'en',
      description: 'The language of the Meow token',
    })
    .argv;

if (argv.input) {
  const code = fs.readFileSync(argv.input, 'utf8');
  const meowList = parseSimplified(code);
  for (const element of meowList) {
    const tokenString = MEOW_TOKENS[argv.lang];
    console.log(tokenString.repeat(element) + SEP_TOKEN);
  }
}
