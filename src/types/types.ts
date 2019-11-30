import {
  DocumentNode,
  GraphQLSchema,
  IntrospectionQuery,
  Source,
} from 'graphql'

export type SchemaTypes =
  | GraphQLSchema
  | GraphQLSchema[]
  | DocumentNode
  | IntrospectionQuery
  | string
  | Source

export type ArtilleryOptions = {
  customQueries?: string[]
  onlyCustomQueries?: boolean
  selectedQueries?: string[]
  queryFile?: boolean
  queryFilePath?: string
  withMutations?: boolean
}

export type K6Options = ArtilleryOptions & {
  vus?: number
  duration?: string
  out?: string[]
}

export type CreateQueries = {
  queries?: string[]
  selectedQueries?: string[]
  withMutations?: boolean
  onlyCustomQueries?: boolean
}

export type LoadTestQuery = {
  name: string
  operation?: 'query' | 'mutation' | 'subscription' | null
  query: string
  variables: any
}

export type CreateQuery = {
  fields: string[]
  queryHeader: string
  isMutation: boolean
  name: string
  operationName: string
  variables: any
}
