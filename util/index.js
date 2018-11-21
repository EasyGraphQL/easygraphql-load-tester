/* eslint-disable valid-typeof */
'use strict'

const constants = require('./constants')

function getField (field, schema, maxDeepLevel = 5, deepLevel = 0) {
  deepLevel++
  if (deepLevel > maxDeepLevel) return

  if (!schema[field.type]) {
    return field.name
  }

  const nestedType = schema[field.type]

  if (nestedType.values.length > 0) {
    return field.name
  }

  const fields = []
  nestedType.fields.forEach(field => {
    if (schema[field.type]) {
      fields.push(getField(field, schema, maxDeepLevel, deepLevel))
    } else {
      fields.push(field.name)
    }
  })

  return `${field.name} { ${fields.join(' ')} }`
}

function createQueryArguments (args, userArgs) {
  try {
    const queryArgs = []
    args.forEach(arg => {
      if (!userArgs[arg.name]) {
        throw new Error()
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
  } catch (err) {
    throw new Error('All query arguments must be defined')
  }
}

function createUnionQuery (nestedType, schema, queryName) {
  const fields = []
  nestedType.fields.forEach(field => {
    const createdField = getField(field, schema, 2)
    fields.push(createdField)
  })
  const unionQuery = `
    ... on ${queryName} {
      ${fields.join(' ')}
    }
  `

  return unionQuery
}

function createQueryToTest (fields, queryHeader) {
  const queryFields = fields.join(' ')

  const newQuery = `
    {
      ${queryHeader} {
        ${queryFields}
      }
    }
  `

  const queryToTest = {
    name: queryHeader,
    query: newQuery
  }

  return queryToTest
}

module.exports = { getField, createQueryArguments, createUnionQuery, createQueryToTest }
