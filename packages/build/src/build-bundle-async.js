import { constants } from '@create-figma-plugin/common'
import findUp from 'find-up'
import { basename, extname } from 'path'
import tempWrite from 'temp-write'
import webpack from 'webpack'
import { createWebpackConfig } from './create-webpack-config'

export async function buildBundleAsync (config, isDevelopment) {
  const entry = {}
  const commandEntryFile = await createCommandEntryFileAsync(config)
  if (commandEntryFile !== null) {
    const key = extractBasename(constants.build.pluginCodeFilePath)
    entry[key] = commandEntryFile
  }
  const uiEntryFile = await createUiEntryFileAsync(config)
  if (uiEntryFile !== null) {
    const key = extractBasename(constants.build.pluginUiFilePath)
    entry[key] = uiEntryFile
  }
  let webpackConfig = createWebpackConfig(entry, isDevelopment)
  const customWebpackConfigPath = await findUp(constants.configFileName)
  if (typeof customWebpackConfigPath !== 'undefined') {
    webpackConfig = require(customWebpackConfigPath)(webpackConfig)
  }
  return new Promise(function (resolve, reject) {
    webpack(webpackConfig, async function (error, stats) {
      if (stats.hasErrors() === true) {
        reject(stats.toJson().errors.join('\n'))
        return
      }
      if (error) {
        reject(error)
        return
      }
      resolve()
    })
  })
}

async function createCommandEntryFileAsync (config) {
  const modules = []
  extractModule(config, 'command', modules)
  if (modules.length === 0) {
    return null
  }
  if (typeof config.relaunchButtons !== 'undefined') {
    extractModules(config.relaunchButtons, 'command', modules)
  }
  return tempWrite(`
    import '@create-figma-plugin/utilities/src/events'
    const modules = ${createRequireCode(modules)}
    global.__command__ = ${
      modules.length > 1 ? 'figma.command' : `'${modules[0].id}'`
    }
    modules[global.__command__]()
  `)
}

async function createUiEntryFileAsync (config) {
  const modules = []
  extractModule(config, 'ui', modules)
  if (modules.length === 0) {
    return null
  }
  if (typeof config.relaunchButtons !== 'undefined') {
    extractModules(config.relaunchButtons, 'ui', modules)
  }
  return tempWrite(`
    import '@create-figma-plugin/utilities/src/events'
    const modules = ${createRequireCode(modules)}
    const rootNode = document.getElementById('create-figma-plugin')
    modules[window.__command__](rootNode, window.__data__, window.__command__)
  `)
}

function extractModules (items, key, result) {
  items.forEach(function (item) {
    extractModule(item, key, result)
  })
}

function extractModule (config, key, result) {
  const id = config.id
  const item = config[key]
  if (typeof item !== 'undefined' && item !== null) {
    result.push({ id, ...item })
  }
  if (typeof config.menu !== 'undefined') {
    extractModules(config.menu, key, result)
  }
}

function createRequireCode (modules) {
  const code = []
  modules.forEach(function (item) {
    code.push(`'${item.id}':require('${item.src}')['${item.handler}']`)
  })
  return `{${code.join(',')}}`
}

function extractBasename (filename) {
  const extension = extname(filename)
  return basename(filename, extension)
}
