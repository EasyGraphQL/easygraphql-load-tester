import {
  ParsedArgs,
  ParsedField,
  ParsedSchema,
  ParsedType,
} from 'easygraphql-parser'
import isObject from 'lodash.isobject'

const MAX_DEEP_LEVEL = 4

export const getField = (
  field: ParsedField,
  schema: ParsedSchema,
  deepLevel = 0
) => {
  deepLevel++
  if (deepLevel > MAX_DEEP_LEVEL) return

  if (!schema[field.type]) {
    return field.name
  }

  const nestedType = schema[field.type]

  if (nestedType.values.length > 0) {
    return field.name
  }

  const fields: string[] = []
  nestedType.fields.forEach((field) => {
    if (schema[field.type]) {
      const nestedField = getField(field, schema, deepLevel)
      if (nestedField) {
        fields.push(nestedField)
      }
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

export const createQueryArguments = (
  args: ParsedArgs[],
  userArgs: any,
  queryName: string
) => {
  const queryArgs: string[] = []
  args
    .filter((arg) => arg.noNull)
    .forEach((arg) => {
      if (!userArgs) {
        throw new Error(`Error in ${queryName} - No query arguments defined`)
      }
      if (typeof userArgs[arg.name] === 'undefined' && arg.noNull) {
        throw new Error(
          `Error in ${queryName} - All required query arguments must be defined - missing ${arg.name}`
        )
      }

      const selectedArg: string | number | boolean = userArgs[arg.name]

      let userArg

      if (isObject(selectedArg)) {
        const nestedArgs: string[] = []
        for (const key of Object.keys(selectedArg)) {
          const arg =
            typeof selectedArg !== 'boolean' && typeof selectedArg !== 'number'
              ? `"${selectedArg[key]}"`
              : selectedArg[key]
          nestedArgs.push(`${key}: ${arg}`)
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

export const createUnionQuery = (
  nestedType: ParsedType,
  schema: ParsedSchema,
  queryType: string
) => {
  const fields: string[] = []
  nestedType.fields.forEach((field) => {
    const createdField = getField(field, schema, 2)
    if (createdField) {
      fields.push(createdField)
    }
  })
  const unionQuery = `
    ... on ${queryType} {
      ${fields.join(' ')}
    }
  `

  return unionQuery
}

export const createQueryToTest = (
  fields: string[],
  queryHeader: string,
  isMutation: boolean,
  name: string
) => {
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
    name,
    query: newQuery,
    operation: isMutation ? 'Mutation' : 'Query',
  }

  return queryToTest
}
