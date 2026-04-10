# Changelog

## [0.2.0] - 2026-04-10

### Bug Fixes

- Fixed `smeow2meow.js` crashing when run without `--lang`: the default
  language was `en`, which is not a valid token key. Changed to `en_1` (`Meow`).

### Documentation

- Added usage instructions for `smeow2meow.js` to both README files.
- Fixed several language issues in `README.md`: grammar corrections and
  clarified the `JE` instruction description.
- Fixed punctuation, pronoun, and formatting issues in `README.zh.md`.
- Aligned content between `README.md` and `README.zh.md`.

### Dependency Updates

- Upgraded ESLint from 9.15.0 to 9.39.4.
- Migrated ESLint configuration from legacy `.eslintrc.json` to the flat
  config format (`eslint.config.js`) required by ESLint 9.
- Removed `eslint-config-google` (incompatible with ESLint 9); Google style
  rules are now inlined in `eslint.config.js`.
- Fixed transitive dependency on vulnerable `lodash@4.17.21` by upgrading
  `portfinder` to 1.0.38, which dropped the lodash dependency.

## [0.1.0] - Initial release
