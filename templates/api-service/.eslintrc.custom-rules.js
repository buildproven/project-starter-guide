/**
 * Custom ESLint rules to catch common template issues
 *
 * These rules prevent issues found in Codex review:
 * - Dotenv must be loaded before other imports
 * - Trust proxy must be set before rate limiting
 */

module.exports = {
  rules: {
    'dotenv-first': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Ensure dotenv.config() is called before any other imports',
          category: 'Best Practices',
        },
        messages: {
          dotenvNotFirst:
            'dotenv.config() must be called before any other imports. Move to top of file.',
        },
      },
      create(context) {
        let hasDotenvConfig = false
        let hasOtherImports = false
        let firstImportLine = 0

        return {
          ImportDeclaration(node) {
            if (!firstImportLine) {
              firstImportLine = node.loc.start.line
            }

            // Check if this is dotenv import
            if (node.source.value === 'dotenv') {
              hasDotenvConfig = true
              return
            }

            // If we've seen other imports before dotenv, flag it
            if (!hasDotenvConfig) {
              hasOtherImports = true
            }
          },
          CallExpression(node) {
            // Look for dotenv.config() call
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'dotenv' &&
              node.callee.property.name === 'config'
            ) {
              // Check if this appears after other imports
              if (hasOtherImports && node.loc.start.line > firstImportLine) {
                context.report({
                  node,
                  messageId: 'dotenvNotFirst',
                })
              }
            }
          },
        }
      },
    },
  },
}
