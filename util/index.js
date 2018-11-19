/* eslint-disable valid-typeof */
'use strict'

const constants = require('./constants')

function getField (field, schema, deepLevel = 0) {
  deepLevel++

  if (deepLevel > 5) return

  if (!schema[field.type]) {
    return field.name
  }

  const nestedType = schema[field.type]
  const fields = []
  nestedType.fields.forEach(field => {
    if (schema[field.type]) {
      fields.push(getField(field, schema, deepLevel))
    } else {
      fields.push(field.name)
    }
  })

  return `${field.name} { ${fields.join(' ')} }`
}

function createQueryArguments (args, userArgs) {
  const queryArgs = []
  args.forEach(arg => {
    if (!userArgs[arg.name]) {
      throw new Error(`${arg.name} is required and it is not defined`)
    }

    const selectedArg = userArgs[arg.name]

    let userArg

    if (typeof selectedArg !== constants.boolean && typeof selectedArg !== constants.number) {
      userArg = `"${userArgs[arg.name]}"`
    } else {
      userArg = selectedArg
    }

    queryArgs.push(`${arg.name}: ${userArg}`)
  })

  let test = queryArgs.join(', ')
  test = test.replace(/"\[/g, '[')
  test = test.replace(/\]"/g, ']')

  return test
}

module.exports = { getField, createQueryArguments }
