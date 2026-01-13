#!/usr/bin/env node

/**
 * Interactive Template Generator
 * Generates customized project templates based on user selections.
 *
 * Usage:
 *   npm run generate                    # Interactive mode
 *   npm run generate -- --template=api  # Skip template selection
 *   npm run generate -- --output=./my-project  # Custom output directory
 */

import { createInterface } from 'node:readline'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve, basename } from 'node:path'
import { randomBytes } from 'node:crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMPLATES_DIR = resolve(__dirname, '../templates')
const TEMPLATES_CONFIG = join(TEMPLATES_DIR, '.templates.json')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
}

function color(text, ...styles) {
  return styles.join('') + text + colors.reset
}

class TemplateGenerator {
  constructor() {
    this.config = this.loadConfig()
    this.rl = null
    this.selections = {}
  }

  loadConfig() {
    try {
      const content = readFileSync(TEMPLATES_CONFIG, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.error(color('Error loading template config:', colors.red), error.message)
      process.exit(1)
    }
  }

  async prompt(question, defaultValue = '') {
    return new Promise((resolve) => {
      const defaultText = defaultValue ? color(` (${defaultValue})`, colors.dim) : ''
      this.rl.question(`${question}${defaultText}: `, (answer) => {
        resolve(answer.trim() || defaultValue)
      })
    })
  }

  async confirm(question, defaultValue = true) {
    const defaultText = defaultValue ? 'Y/n' : 'y/N'
    const answer = await this.prompt(`${question} [${defaultText}]`)
    if (!answer) return defaultValue
    return answer.toLowerCase().startsWith('y')
  }

  async select(question, options, defaultValue) {
    console.log(`\n${color(question, colors.cyan)}`)
    options.forEach((opt, i) => {
      const isDefault = opt === defaultValue
      const marker = isDefault ? color(' (default)', colors.dim) : ''
      console.log(`  ${color(`${i + 1}.`, colors.blue)} ${opt}${marker}`)
    })

    const answer = await this.prompt('Enter number')
    if (!answer) return defaultValue

    const index = parseInt(answer, 10) - 1
    if (index >= 0 && index < options.length) {
      return options[index]
    }
    console.log(color('Invalid selection, using default', colors.yellow))
    return defaultValue
  }

  async multiSelect(question, options, defaults = []) {
    console.log(`\n${color(question, colors.cyan)}`)
    console.log(color('  Enter numbers separated by commas (e.g., 1,3)', colors.dim))
    options.forEach((opt, i) => {
      const isDefault = defaults.includes(opt)
      const marker = isDefault ? color(' *', colors.green) : ''
      console.log(`  ${color(`${i + 1}.`, colors.blue)} ${opt}${marker}`)
    })

    const answer = await this.prompt('Enter numbers', defaults.map((d) => options.indexOf(d) + 1).join(','))
    if (!answer) return defaults

    const indices = answer.split(',').map((n) => parseInt(n.trim(), 10) - 1)
    const selected = indices.filter((i) => i >= 0 && i < options.length).map((i) => options[i])

    return selected.length > 0 ? selected : defaults
  }

  printBanner() {
    console.log('\n' + color('=' .repeat(60), colors.cyan))
    console.log(color('  Project Starter Guide - Template Generator', colors.bold, colors.blue))
    console.log(color('=' .repeat(60), colors.cyan) + '\n')
  }

  printTemplateInfo(templateId, template) {
    console.log(`\n${color('Template:', colors.bold)} ${template.name}`)
    console.log(`${color('Description:', colors.dim)} ${template.description}`)
    console.log(`${color('Complexity:', colors.dim)} Level ${template.complexity}`)
    console.log(`${color('Stack:', colors.dim)} ${template.stack.join(', ')}`)
  }

  async selectTemplate() {
    const templates = Object.entries(this.config.templates)

    console.log(color('\nAvailable Templates:\n', colors.bold))

    templates.forEach(([_id, template], i) => {
      const complexity = '●'.repeat(template.complexity) + '○'.repeat(3 - template.complexity)
      console.log(`  ${color(`${i + 1}.`, colors.blue)} ${color(template.name, colors.bold)} ${color(`[${complexity}]`, colors.dim)}`)
      console.log(`     ${color(template.description, colors.dim)}`)
      console.log(`     ${color(`Stack: ${template.stack.slice(0, 4).join(', ')}`, colors.dim)}`)
      console.log()
    })

    const answer = await this.prompt('Select template (1-' + templates.length + ')')
    const index = parseInt(answer, 10) - 1

    if (index >= 0 && index < templates.length) {
      return templates[index]
    }

    console.log(color('Invalid selection', colors.red))
    process.exit(1)
  }

  async getProjectDetails(templateId) {
    console.log(color('\n--- Project Details ---', colors.bold))

    const projectName = await this.prompt('Project name', `my-${templateId}`)
    const projectDescription = await this.prompt('Description', `A ${templateId} project`)
    const author = await this.prompt('Author', this.config.defaults.author)

    return { projectName, projectDescription, author }
  }

  async getCustomizations(template) {
    if (!template.customizations || Object.keys(template.customizations).length === 0) {
      return {}
    }

    console.log(color('\n--- Customization Options ---', colors.bold))

    const customizations = {}

    for (const [key, config] of Object.entries(template.customizations)) {
      switch (config.type) {
        case 'select':
          customizations[key] = await this.select(config.label, config.options, config.default)
          break
        case 'multiselect':
          customizations[key] = await this.multiSelect(config.label, config.options, config.default)
          break
        case 'boolean':
          customizations[key] = await this.confirm(config.label, config.default)
          break
        default:
          customizations[key] = config.default
      }
    }

    return customizations
  }

  async getOutputDirectory(projectName) {
    console.log(color('\n--- Output Location ---', colors.bold))

    const defaultOutput = `./${projectName}`
    const outputDir = await this.prompt('Output directory', defaultOutput)

    return resolve(process.cwd(), outputDir)
  }

  generateEnvFile(template, customizations) {
    if (!template.envVars || template.envVars.length === 0) {
      return null
    }

    const lines = ['# Environment Variables', `# Generated by Template Generator`, '']

    for (const envVar of template.envVars) {
      const value = envVar.required ? envVar.example : (envVar.default || envVar.example || '')

      // Add special handling for auth providers
      if (envVar.key.includes('GITHUB') && !customizations.authProviders?.includes('github')) {
        lines.push(`# ${envVar.key}=${value}`)
        continue
      }
      if (envVar.key.includes('GOOGLE') && !customizations.authProviders?.includes('google')) {
        lines.push(`# ${envVar.key}=${value}`)
        continue
      }
      if (envVar.key.includes('STRIPE') && customizations.includeStripe === false) {
        lines.push(`# ${envVar.key}=${value}`)
        continue
      }

      // Generate secrets for secret keys
      if (envVar.key.includes('SECRET') && !envVar.key.includes('STRIPE')) {
        const secret = randomBytes(32).toString('hex')
        lines.push(`${envVar.key}=${secret}`)
      } else {
        lines.push(`${envVar.key}=${value}`)
      }
    }

    return lines.join('\n')
  }

  copyTemplateFiles(templateId, outputDir, projectDetails, customizations) {
    const sourceDir = join(TEMPLATES_DIR, templateId)

    // Directories to skip
    const skipDirs = ['node_modules', '.next', 'dist', 'build', 'coverage', '.prisma-cache', '.prisma-home']
    const skipFiles = ['.env', '.env.local', 'package-lock.json']

    // Recursively copy files
    const copyRecursive = (src, dest) => {
      const entries = readdirSync(src, { withFileTypes: true })

      for (const entry of entries) {
        const srcPath = join(src, entry.name)
        const destPath = join(dest, entry.name)

        if (entry.isDirectory()) {
          if (skipDirs.includes(entry.name)) continue
          mkdirSync(destPath, { recursive: true })
          copyRecursive(srcPath, destPath)
        } else {
          if (skipFiles.includes(entry.name)) continue

          let content = readFileSync(srcPath, 'utf8')

          // Transform package.json
          if (entry.name === 'package.json') {
            content = this.transformPackageJson(content, projectDetails, customizations)
          }

          // Transform README.md
          if (entry.name === 'README.md') {
            content = this.transformReadme(content, projectDetails)
          }

          writeFileSync(destPath, content)
        }
      }
    }

    mkdirSync(outputDir, { recursive: true })
    copyRecursive(sourceDir, outputDir)
  }

  transformPackageJson(content, projectDetails, customizations) {
    const pkg = JSON.parse(content)

    pkg.name = projectDetails.projectName
    pkg.description = projectDetails.projectDescription
    pkg.author = projectDetails.author
    pkg.version = '0.1.0'

    // Remove features based on customizations
    if (customizations.includeAuth === false) {
      delete pkg.dependencies?.jsonwebtoken
      delete pkg.dependencies?.bcryptjs
      delete pkg.devDependencies?.['@types/jsonwebtoken']
      delete pkg.devDependencies?.['@types/bcryptjs']
    }

    if (customizations.includeRateLimiting === false) {
      delete pkg.dependencies?.['express-rate-limit']
    }

    if (customizations.includeStripe === false) {
      delete pkg.dependencies?.stripe
      delete pkg.dependencies?.['@stripe/stripe-js']
    }

    return JSON.stringify(pkg, null, 2)
  }

  transformReadme(content, projectDetails) {
    // Replace template name with project name
    const lines = content.split('\n')
    if (lines[0].startsWith('#')) {
      lines[0] = `# ${projectDetails.projectName}`
    }

    // Add generated notice
    const notice = `\n> Generated from Project Starter Guide on ${new Date().toISOString().split('T')[0]}\n`

    return lines.slice(0, 2).join('\n') + notice + lines.slice(2).join('\n')
  }

  printSummary(outputDir, projectDetails, templateId) {
    console.log('\n' + color('=' .repeat(60), colors.green))
    console.log(color('  Project Generated Successfully!', colors.bold, colors.green))
    console.log(color('=' .repeat(60), colors.green))

    console.log(`\n${color('Project:', colors.bold)} ${projectDetails.projectName}`)
    console.log(`${color('Location:', colors.bold)} ${outputDir}`)

    console.log(color('\nNext Steps:', colors.bold))
    console.log(`  ${color('1.', colors.blue)} cd ${basename(outputDir)}`)
    console.log(`  ${color('2.', colors.blue)} npm install`)

    if (templateId === 'about-me-page') {
      console.log(`  ${color('3.', colors.blue)} Open index.html in browser`)
    } else {
      console.log(`  ${color('3.', colors.blue)} cp .env.example .env  ${color('# Configure environment', colors.dim)}`)
      console.log(`  ${color('4.', colors.blue)} npm run dev`)
    }

    console.log(color('\nHappy coding!', colors.cyan) + '\n')
  }

  parseArgs() {
    const args = process.argv.slice(2)
    const parsed = {}

    for (const arg of args) {
      if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=')
        parsed[key] = value ?? true
      }
    }

    return parsed
  }

  async run() {
    const args = this.parseArgs()

    // Non-interactive mode with --defaults
    if (args.defaults) {
      return this.runNonInteractive(args)
    }

    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    try {
      this.printBanner()

      // Select template
      let templateId, template
      if (args.template) {
        const shortNames = {
          api: 'api-service',
          saas: 'saas-level-1',
          mobile: 'mobile-app',
          about: 'about-me-page',
        }
        templateId = shortNames[args.template] || args.template
        template = this.config.templates[templateId]
        if (!template) {
          console.error(color(`Template not found: ${args.template}`, colors.red))
          process.exit(1)
        }
        this.printTemplateInfo(templateId, template)
      } else {
        [templateId, template] = await this.selectTemplate()
        this.printTemplateInfo(templateId, template)
      }

      // Get project details
      const projectDetails = await this.getProjectDetails(templateId)

      // Get customizations
      const customizations = await this.getCustomizations(template)

      // Get output directory
      const outputDir = args.output
        ? resolve(process.cwd(), args.output)
        : await this.getOutputDirectory(projectDetails.projectName)

      // Check if output exists
      if (existsSync(outputDir)) {
        const overwrite = await this.confirm(`Directory ${outputDir} exists. Overwrite?`, false)
        if (!overwrite) {
          console.log(color('Aborted.', colors.yellow))
          process.exit(0)
        }
      }

      // Generate
      console.log(color('\nGenerating project...', colors.cyan))

      this.copyTemplateFiles(templateId, outputDir, projectDetails, customizations)

      // Generate .env.example
      const envContent = this.generateEnvFile(template, customizations)
      if (envContent) {
        writeFileSync(join(outputDir, '.env.example'), envContent)
      }

      this.printSummary(outputDir, projectDetails, templateId)

    } finally {
      this.rl.close()
    }
  }

  runNonInteractive(args) {
    const shortNames = {
      api: 'api-service',
      saas: 'saas-level-1',
      mobile: 'mobile-app',
      about: 'about-me-page',
    }

    const templateId = shortNames[args.template] || args.template || 'api-service'
    const template = this.config.templates[templateId]

    if (!template) {
      console.error(color(`Template not found: ${templateId}`, colors.red))
      process.exit(1)
    }

    const projectName = args.name || `my-${templateId}`
    const outputDir = resolve(process.cwd(), args.output || `./${projectName}`)

    const projectDetails = {
      projectName,
      projectDescription: `A ${templateId} project`,
      author: this.config.defaults.author,
    }

    // Use default customizations
    const customizations = {}
    if (template.customizations) {
      for (const [key, config] of Object.entries(template.customizations)) {
        customizations[key] = config.default
      }
    }

    console.log(color(`Generating ${template.name} at ${outputDir}...`, colors.cyan))

    this.copyTemplateFiles(templateId, outputDir, projectDetails, customizations)

    const envContent = this.generateEnvFile(template, customizations)
    if (envContent) {
      writeFileSync(join(outputDir, '.env.example'), envContent)
    }

    console.log(color(`Done! Project created at ${outputDir}`, colors.green))
    return outputDir
  }
}

// Main entry point
const generator = new TemplateGenerator()
generator.run().catch((error) => {
  console.error(color('Error:', colors.red), error.message)
  process.exit(1)
})
