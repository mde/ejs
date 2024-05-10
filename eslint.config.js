export default [
  {
    files: [ '*.js', '*.mjs', '*.cjs' ],
    languageOptions: {
      globals: {
        "suite": "readonly",
        "test": "readonly"
      },
      "parserOptions": {
        "ecmaVersion": 6,
        "requireConfigFile": false,
      },
    },
    rules: {
        "linebreak-style": [
            "error",
            "unix"
        ],
        "no-trailing-spaces": 2,
        "indent": [
          "error",
          2
        ],
        "quotes": [
            "error",
            "single",
            {
              "avoidEscape": true,
              "allowTemplateLiterals": true
            }
        ],
        "semi": [
            "error",
            "always"
        ],
        "comma-style": [
            "error",
            "last"
        ],
        "no-console": 0,
        "no-useless-escape": 0
    }
  },
  {
    files: [ '*.js', '*.mjs' ],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: [ '*.cjs' ],
    languageOptions: {
      sourceType: 'commonjs',
    },
  },
]


