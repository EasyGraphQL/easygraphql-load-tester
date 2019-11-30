import {
  ParsedArgs,
  ParsedField,
  ParsedSchema,
  ParsedType,
} from 'easygraphql-parser'
import { CreateQuery } from './types/types'

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
  const queryVariables: string[] = []
  const queryArgs: string[] = []

  const validateArg = (userArg, arg: ParsedArgs) => {
    if (typeof userArg === 'undefined' && arg.noNull) {
      throw new Error(
        `Error in ${queryName} - All required query arguments must be defined - missing ${arg.name}`
      )
    }
  }

  args.forEach((arg) => {
    if (Array.isArray(userArgs)) {
      userArgs.forEach((userArg) => {
        validateArg(userArg[arg.name], arg)
      })
    } else {
      if (!userArgs) {
        throw new Error(`Error in ${queryName} - No query arguments defined`)
      }
      validateArg(userArgs[arg.name], arg)
    }

    const variableDefinition = arg.isArray
      ? `$${arg.name}: [${arg.type}${arg.noNullArrayValues ? '!' : ''}]${
          arg.noNull ? '!' : ''
        }`
      : `$${arg.name}: ${arg.type}${arg.noNull ? '!' : ''}`

    queryVariables.push(variableDefinition)
    queryArgs.push(`${arg.name}: $${arg.name}`)
  })

  return {
    variables: queryVariables,
    args: queryArgs,
  }
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

export const createQuery = ({
  fields,
  queryHeader,
  isMutation,
  name,
  operationName,
  variables,
}: CreateQuery) => {
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
    query ${operationName} {
        ${queryHeader} ${selectedFields}
      }
    `
  } else {
    newQuery = `
    mutation ${operationName} {
        ${queryHeader} ${selectedFields}
      }
    `
  }

  if (Array.isArray(variables)) {
    return variables.map((val) => ({
      name,
      query: newQuery,
      operation: isMutation ? 'Mutation' : 'Query',
      variables: val || {},
    }))
  }

  return {
    name,
    query: newQuery,
    operation: isMutation ? 'Mutation' : 'Query',
    variables: variables || {},
  }
}
