/**
 * shared/services/framework-detector.service.js — Fase 2
 *
 * Detecta el/los frameworks de un proyecto a partir de su mapa de archivos:
 * 1. Manifests de dependencias (package.json, composer.json, requirements.txt,
 *    pom.xml, build.gradle, *.csproj, Gemfile, go.mod, pubspec.yaml)
 * 2. Archivos "huella" característicos (angular.json, next.config.js, artisan…)
 *
 * Entrada: el mapa generado por buildFileMap({ includeContent: true }).
 * Salida: { frameworks: [...], languages: [...], manifests: [...] }
 */

/** Reglas por dependencia declarada en package.json. Orden = prioridad. */
const NPM_FRAMEWORK_RULES = [
  { dependency: 'next',              framework: 'Next.js' },
  { dependency: 'nuxt',              framework: 'Nuxt' },
  { dependency: '@angular/core',     framework: 'Angular' },
  { dependency: '@nestjs/core',      framework: 'NestJS' },
  { dependency: 'svelte',            framework: 'Svelte' },
  { dependency: 'vue',               framework: 'Vue' },
  { dependency: 'react',             framework: 'React' },
  { dependency: 'fastify',           framework: 'Fastify' },
  { dependency: 'express',           framework: 'Express' },
  { dependency: 'electron',          framework: 'Electron' },
  { dependency: 'react-native',      framework: 'React Native' },
]

/** Archivos huella → framework (independientes del manifest). */
const FINGERPRINT_FILES = [
  { pattern: /(^|\/)angular\.json$/,           framework: 'Angular' },
  { pattern: /(^|\/)next\.config\.(js|mjs|ts)$/, framework: 'Next.js' },
  { pattern: /(^|\/)nuxt\.config\.(js|ts)$/,   framework: 'Nuxt' },
  { pattern: /(^|\/)svelte\.config\.js$/,      framework: 'Svelte' },
  { pattern: /(^|\/)vite\.config\.(js|ts)$/,   framework: 'Vite' },
  { pattern: /(^|\/)artisan$/,                 framework: 'Laravel' },
  { pattern: /(^|\/)manage\.py$/,              framework: 'Django' },
  { pattern: /(^|\/)Gemfile$/,                 framework: 'Ruby on Rails (posible)' },
  { pattern: /(^|\/)pom\.xml$/,                framework: 'Maven (Java)' },
  { pattern: /(^|\/)build\.gradle(\.kts)?$/,   framework: 'Gradle (Java/Kotlin)' },
  { pattern: /\.csproj$/,                      framework: '.NET' },
  { pattern: /(^|\/)go\.mod$/,                 framework: 'Go Modules' },
  { pattern: /(^|\/)pubspec\.yaml$/,           framework: 'Flutter/Dart' },
  { pattern: /(^|\/)Dockerfile$/,              framework: 'Docker' },
]

const LANGUAGE_BY_EXTENSION = {
  js: 'JavaScript', jsx: 'JavaScript', ts: 'TypeScript', tsx: 'TypeScript',
  py: 'Python', php: 'PHP', java: 'Java', cs: 'C#',
  cpp: 'C++', c: 'C', h: 'C/C++', hpp: 'C++',
  rb: 'Ruby', go: 'Go', rs: 'Rust', kt: 'Kotlin',
  sql: 'SQL', html: 'HTML', css: 'CSS', scss: 'SCSS',
  vue: 'Vue', svelte: 'Svelte',
}

function safeJsonParse(text) {
  try { return JSON.parse(text) } catch { return null }
}

/** Analiza un package.json y devuelve frameworks detectados + dependencias. */
function analyzePackageJson(content) {
  const pkg = safeJsonParse(content)
  if (!pkg) return { frameworks: [], dependencies: [] }

  const allDependencies = { ...pkg.dependencies, ...pkg.devDependencies }
  const frameworks = []
  for (const rule of NPM_FRAMEWORK_RULES) {
    if (allDependencies[rule.dependency]) {
      frameworks.push({
        name: rule.framework,
        version: allDependencies[rule.dependency],
        source: 'package.json',
      })
    }
  }
  const dependencies = Object.entries(allDependencies).map(([name, version]) => ({
    name,
    version,
    isDev: Boolean(pkg.devDependencies?.[name]),
  }))
  return { frameworks, dependencies }
}

/** Analiza composer.json (PHP). */
function analyzeComposerJson(content) {
  const composer = safeJsonParse(content)
  if (!composer) return { frameworks: [] }
  const require = { ...composer.require, ...composer['require-dev'] }
  const frameworks = []
  if (require['laravel/framework']) frameworks.push({ name: 'Laravel', version: require['laravel/framework'], source: 'composer.json' })
  if (require['symfony/framework-bundle']) frameworks.push({ name: 'Symfony', version: require['symfony/framework-bundle'], source: 'composer.json' })
  if (require['codeigniter4/framework']) frameworks.push({ name: 'CodeIgniter', version: require['codeigniter4/framework'], source: 'composer.json' })
  return { frameworks }
}

/** Analiza requirements.txt (Python). */
function analyzeRequirementsTxt(content) {
  const lines = content.split('\n').map((l) => l.trim().toLowerCase())
  const frameworks = []
  const has = (name) => lines.some((l) => l.startsWith(name))
  if (has('django'))  frameworks.push({ name: 'Django', source: 'requirements.txt' })
  if (has('flask'))   frameworks.push({ name: 'Flask', source: 'requirements.txt' })
  if (has('fastapi')) frameworks.push({ name: 'FastAPI', source: 'requirements.txt' })
  return { frameworks }
}

/** Analiza pom.xml (Java/Maven) buscando Spring. */
function analyzePomXml(content) {
  const frameworks = []
  if (/spring-boot/i.test(content))      frameworks.push({ name: 'Spring Boot', source: 'pom.xml' })
  else if (/springframework/i.test(content)) frameworks.push({ name: 'Spring', source: 'pom.xml' })
  return { frameworks }
}

/**
 * Detecta frameworks, lenguajes y manifests a partir de un mapa de archivos.
 *
 * @param {{files: Array}} fileMap — Salida de buildFileMap({ includeContent: true })
 * @returns {{
 *   frameworks: Array<{name:string, version?:string, source:string}>,
 *   languages: Array<{name:string, files:number}>,
 *   manifests: string[],
 *   dependencies: Array
 * }}
 */
export function detectFrameworks(fileMap) {
  const frameworks = new Map() // name → info (dedupe)
  const manifests = []
  let dependencies = []

  const addFrameworks = (list) => {
    for (const fw of list) {
      const existing = frameworks.get(fw.name)
      // Una entrada con versión (manifest) tiene prioridad sobre una huella sin versión
      if (!existing || (fw.version && !existing.version)) frameworks.set(fw.name, fw)
    }
  }

  for (const file of fileMap.files) {
    // 1) Manifests con contenido
    if (file.content) {
      if (file.name === 'package.json' && !file.path.includes('node_modules')) {
        manifests.push(file.path)
        const result = analyzePackageJson(file.content)
        addFrameworks(result.frameworks)
        if (result.dependencies.length > dependencies.length) dependencies = result.dependencies
      } else if (file.name === 'composer.json') {
        manifests.push(file.path)
        addFrameworks(analyzeComposerJson(file.content).frameworks)
      } else if (file.name === 'requirements.txt') {
        manifests.push(file.path)
        addFrameworks(analyzeRequirementsTxt(file.content).frameworks)
      } else if (file.name === 'pom.xml') {
        manifests.push(file.path)
        addFrameworks(analyzePomXml(file.content).frameworks)
      }
    }
    // 2) Archivos huella
    for (const fingerprint of FINGERPRINT_FILES) {
      if (fingerprint.pattern.test(file.path) && !frameworks.has(fingerprint.framework)) {
        frameworks.set(fingerprint.framework, { name: fingerprint.framework, source: file.path })
      }
    }
  }

  // 3) Lenguajes por conteo de extensiones
  const languageCount = new Map()
  for (const file of fileMap.files) {
    const language = LANGUAGE_BY_EXTENSION[file.extension]
    if (language) languageCount.set(language, (languageCount.get(language) || 0) + 1)
  }
  const languages = [...languageCount.entries()]
    .map(([name, files]) => ({ name, files }))
    .sort((a, b) => b.files - a.files)

  return {
    frameworks: [...frameworks.values()],
    languages,
    manifests,
    dependencies,
  }
}
