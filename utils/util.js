/* eslint-disable valid-typeof */
'use strict'

const isObject = require('lodash.isobject')

function getField(field, schema, maxDeepLevel = 5, deepLevel = 0) {
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
  nestedType.fields.forEach((field) => {
    if (schema[field.type]) {
      fields.push(getField(field, schema, maxDeepLevel, deepLevel))
    } else {
      fields.push(field.name)
    }
  })

  let selectedFields = ''
  if (fields.length > 0) {
    selectedFields = `{ ${fields.join(' ')} }`
  }

  return `${field.name} ${selectedFields}`
}

function createQueryArguments(args, userArgs) {
  const queryArgs = []
  args.forEach((arg) => {
    if (!userArgs) {
      throw new Error('No query arguments defined')
    }
    if (typeof userArgs[arg.name] === 'undefined' && arg.noNull) {
      throw new Error(
        `All required query arguments must be defined - missing ${arg.name}`
      )
    }

    const selectedArg = userArgs[arg.name]

    let userArg

    if (isObject(selectedArg)) {
      const nestedArgs = []
      for (const key of Object.keys(selectedArg)) {
        nestedArgs.push(`${key}: "${selectedArg[key]}"`)
      }
      userArg = `{${nestedArgs.join(', ')}}`
    } else if (
      typeof selectedArg !== 'boolean' &&
      typeof selectedArg !== 'number'
    ) {
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

function createUnionQuery(nestedType, schema, queryName) {
  const fields = []
  nestedType.fields.forEach((field) => {
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

function createQueryToTest(fields, queryHeader, isMutation) {
  let selectedFields = ''

  if (fields.length > 0) {
    const queryFields = fields.join(' ')
    selectedFields = `{
      ${queryFields}
    }`
  }

  let newQuery

  if (!isMutation) {
    newQuery = `
      {
        ${queryHeader} ${selectedFields}
      }
    `
  } else {
    newQuery = `
    mutation {
        ${queryHeader} ${selectedFields}
      }
    `
  }

  const queryToTest = {
    name: queryHeader,
    query: newQuery,
    operation: isMutation ? 'Mutation' : 'Query',
  }

  return queryToTest
}

module.exports = {
  getField,
  createQueryArguments,
  createUnionQuery,
  createQueryToTest,
}
