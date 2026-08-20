import { dirname, resolve } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

import { defineConfig } from 'vite'

// Note that Vite tries to inject `__dirname` but if we leave it undefined then
// Node will complain ("ERROR: __dirname is not defined in ES module scope") so
// we use our own special name here
const appDir = dirname(fileURLToPath(import.meta.url))
const projDir = resolve(appDir, '..', '..')

function getGitTag() {
  try {
    return execSync('git describe --tags --exact-match HEAD', {
      cwd: projDir,
      stdio: ['ignore', 'pipe', 'ignore']
    }).toString().trim()
  } catch {
    return ''
  }
}

function getLatestGitTag() {
  try {
    return execSync('git tag --sort=-v:refname', {
      cwd: projDir,
      stdio: ['ignore', 'pipe', 'ignore']
    })
      .toString()
      .split(/\r?\n/)
      .map(tag => tag.trim())
      .find(tag => tag.length > 0) || ''
  } catch {
    return ''
  }
}

export default defineConfig(env => {
  const gitTag = getGitTag()
  const appVersion = gitTag || getLatestGitTag() || '1.0.1'
  const versionUrl = gitTag
    ? `https://github.com/climatechoice/felix/releases/tag/${encodeURIComponent(gitTag)}`
    : 'https://github.com/climatechoice/felix/releases'

  return {
    // Don't clear the screen in dev mode so that we can see builder output
    clearScreen: false,

    // Use this directory as the root directory for the app project
    root: appDir,

    // Use `.` as the base directory (instead of the default `/`); this controls
    // how the path to the js/css files are generated in `index.html`
    base: '',

    // Load static files from `static` (instead of the default `public`)
    publicDir: 'static',

    // Inject special values into the generated JS
    define: {
      // Set a flag to indicate that this is a production build
      __PRODUCTION__: env.mode === 'production',
      __APP_VERSION__: JSON.stringify(appVersion),
      __APP_GIT_TAG__: JSON.stringify(gitTag),
      __APP_VERSION_URL__: JSON.stringify(versionUrl)
    },

    resolve: {
      alias: {
        '@core': resolve(appDir, '..', 'core', 'src'),
        '@core-strings': resolve(appDir, '..', 'core', 'strings'),
        '@prep': resolve(projDir, 'sde-prep')
      }
    },

    build: {
      // Write output files to `public` (instead of the default `dist`)
      outDir: 'public',

      // Write js/css files to `public` (instead of the default `<outDir>/assets`)
      assetsDir: '',

      // TODO: Uncomment for debugging purposes
      // minify: false,

      rollupOptions: {
        output: {
          // XXX: Prevent vite from creating a separate `vendor.js` file
          manualChunks: undefined
        }
      }
    },

    server: {
      // Run the dev server at `localhost:8080` by default
      port: 8080,

      // Open the app in the browser by default
      open: '/index.html'
    }
  }
})
