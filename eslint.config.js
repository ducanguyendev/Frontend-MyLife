import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // This codebase intentionally hydrates UI state and invokes async loaders
      // from effects. The React compiler advisory is not a correctness rule.
      'react-hooks/set-state-in-effect': 'off',
      // Context modules export both their provider and their typed hook.
      'react-refresh/only-export-components': 'off',
    },
  },
])
