declare module 'easygraphql-parser' {
  import {
    DocumentNode,
    GraphQLSchema,
    IntrospectionQuery,
    Source,
  } from 'graphql'

  export type ParsedArgs = {
    name: string
    noNull: boolean
    isArray: boolean
    type: string
    noNullArrayValues: boolean
    isDeprecated: boolean
  }

  export type ParsedField = {
    name: string
    type: string
    noNull: boolean
    isArray: boolean
    arguments: ParsedArgs[]
    noNullArrayValues: boolean
    isDeprecated: boolean
  }

  export type ParsedType = {
    type: string
    description?: string
    fields: ParsedField[]
    values: []
    types: string[]
    implementedTypes: string[]
  }

  export type ParsedSchema = {
    Query?: ParsedType
    Mutation?: ParsedType
    [name: string]: ParsedType
  }

  const SchemaParser = (
    schema:
      | string
      | GraphQLSchema
      | GraphQLSchema[]
      | DocumentNode
      | IntrospectionQuery
      | Source
      | SchemaDefinitionNode
  ): ParsedSchema => ({})
  export default SchemaParser
}
