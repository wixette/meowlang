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
 * @fileoverview Command-line utility that converts a .smeow (simplified)
 * file into a .meow (token) file.
 *
 * Usage:
 *   node src/smeow2meow.js -i <file.smeow>
 *   node src/smeow2meow.js -i <file.smeow> --lang zh
 */

import fs from 'fs';
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {parseSimplified, MEOW_TOKENS, SEP_TOKEN} from './meowlang.js';

const argv = yargs(hideBin(process.argv))
    .option('input', {
      alias: 'i',
      type: 'string',
      describe: 'The input .smeow file path',
    })
    .option('lang', {
      alias: 'l',
      type: 'string',
      choices: Object.keys(MEOW_TOKENS),
      default: 'en_1',
      describe: 'The Meow token language/variant to use in the output',
    })
    .argv;

if (argv.input) {
  const code = fs.readFileSync(/** @type {string} */ (argv.input), 'utf8');
  const meowList = parseSimplified(code);
  const token = MEOW_TOKENS[/** @type {string} */ (argv.lang)];
  for (const value of meowList) {
    console.log(token.repeat(value) + SEP_TOKEN);
  }
}
