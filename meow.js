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

 import * as fs from 'fs';
 import { runMeowLang, CAT_EMOJI } from './meowlang.js';

if (process.argv.length >= 3) {
  const filepath = process.argv[2];
  fs.readFile(filepath, 'utf8' , (err, code) => {
    if (err) {
      console.log(errorEmoji);
      return;
    }
    runMeowLang(code.toString(),
        (message) => {
          process.stderr.write(`${message}\n`);
        },
        () => {
          process.stdout.write('\n');
        },
        () => {
          process.stdout.write(`${CAT_EMOJI}`);
        });
  })
}
