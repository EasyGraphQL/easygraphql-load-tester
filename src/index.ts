import { spawn } from 'child_process'
import schemaParser, { ParsedField, ParsedSchema } from 'easygraphql-parser'
import fs from 'fs'
import { getOperationAST, parse } from 'graphql'
import flatten from 'lodash.flatten'
import path from 'path'
import {
  ArtilleryOptions,
  CreateQueries,
  K6Options,
  LoadTestQuery,
  SchemaTypes,
} from './types/types'
import {
  createQueryArguments,
  createQueryString,
  createUnionQuery,
  getField,
} from './utils'

export = class LoadTesting {
  private schema: ParsedSchema
  private arguments: { [name: string]: any }
  private queryField: string
  private mutationField: string
  constructor(schema: SchemaTypes, args = {}) {
    if (!schema) {
      throw new Error('The schema is required')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
    this.queryField = (schema as any)?.schemaDefinition?.query?.field || 'Query'
    this.mutationField =
      (schema as any)?.schemaDefinition?.mutation?.field || 'Mutation'
  }

  artillery(options: ArtilleryOptions = {}) {
    const queries = this.createQueries({
      queries: options?.customQueries,
      selectedQueries: options?.selectedQueries,
      withMutations: options?.withMutations,
      onlyCustomQueries: options?.onlyCustomQueries,
    })

    if (options?.queryFile) {
      const queryFileName = 'easygraphql-load-tester-queries.json'
      const filePath = options?.queryFilePath
        ? path.join(options.queryFilePath, queryFileName)
        : path.join(path.resolve(), queryFileName)

      fs.writeFileSync(filePath, JSON.stringify(queries))
    }

    /* istanbul ignore next */
    return (
      context: { vars: { cases: LoadTestQuery[] } },
      events: any,
      done: () => void
    ) => {
      context.vars['cases'] = queries
      return done()
    }
  }

  k6(fileName: string, options: K6Options = {}) {
    if (!fileName) {
      throw new Error('The k6 file name is missing')
    }
    const queryFileName = 'easygraphql-load-tester-queries.json'

    const queries = this.createQueries({
      queries: options?.customQueries,
      selectedQueries: options?.selectedQueries,
      withMutations: options?.withMutations,
      onlyCustomQueries: options?.onlyCustomQueries,
    })
    const selectedVus = options?.vus || ''

    const selectedDuration = options?.duration || ''

    fs.writeFileSync(queryFileName, JSON.stringify(queries))

    const outArgs = options.out ? options.out.map((out) => `--out ${out}`) : []

    const k6Process = spawn('k6 run', [...outArgs, fileName], {
      stdio: 'inherit',
      shell: true,
      env: {
        VUS: selectedVus.toString(), // check as string
        DURATION: selectedDuration,
      },
    })

    k6Process.on('exit', () => {
      if (!options?.queryFile) {
        fs.unlinkSync(queryFileName)
      }
    })
  }

  createQueries({
    queries,
    selectedQueries,
    withMutations,
    onlyCustomQueries,
  }: CreateQueries = {}) {
    let loadTestQueries: LoadTestQuery[] = []

    if (
      queries &&
      selectedQueries &&
      !(Array.isArray(queries) && Array.isArray(selectedQueries))
    ) {
      throw new Error('Custom queries and selected queries should be an array')
    }

    if (queries) {
      loadTestQueries = queries.map((query) => {
        const parsedQuery = parse(query)
        const operationNode = getOperationAST(parsedQuery, null)

        const name = (operationNode?.selectionSet.selections[0] as any).name
          .value

        return {
          name,
          operation: operationNode && operationNode.operation,
          query,
          variables: this.arguments[name] || {},
        }
      })
    }

    if (onlyCustomQueries && queries) {
      if (selectedQueries) {
        loadTestQueries = loadTestQueries.filter((query) => {
          for (let i = 0; i < selectedQueries.length; i++) {
            if (query.name && query.name === selectedQueries[i]) return true
          }
        })
      }
    } else {
      const schemaDefinitions = [
        {
          definition: this.queryField,
          isMutation: false,
        },
      ]

      if (withMutations) {
        schemaDefinitions.push({
          definition: this.mutationField,
          isMutation: true,
        })
      }

      schemaDefinitions.forEach((schemaDefinition) => {
        this.schema[schemaDefinition.definition].fields.forEach((query) => {
          if (
            !(
              selectedQueries?.length && selectedQueries.indexOf(query.name) < 0
            )
          ) {
            loadTestQueries.push(
              this.createOperation(query, schemaDefinition.isMutation) as any
            )
          }
        })
      })
    }

    return flatten(loadTestQueries)
  }

  createOperation(query: ParsedField, isMutation: boolean) {
    let queryHeader = query.name
    let name = query.name
    let operationName = query.name.toUpperCase()

    if (query.arguments.length) {
      const createdArgs = createQueryArguments(
        query.arguments,
        this.arguments[query.name],
        query.name
      )

      if (createdArgs.variables.length && createdArgs.args.length) {
        queryHeader = `${name}(${createdArgs.args.join(', ')})`
        name = `${name} with arguments: { ${createdArgs.args.join(', ')} }`
        operationName = `${operationName}(${createdArgs.variables.join(', ')})`
      }
    }

    // Check if the operation only request scalar type.
    if (['ID', 'String', 'Int', 'Float', 'Boolean'].indexOf(query.type) >= 0) {
      return createQueryString({
        fields: [],
        queryHeader: queryHeader,
        isMutation,
        name,
        operationName,
        variables: this.arguments[query.name],
      })
    }

    // Select the nested type from the object of types.
    const nestedType = this.schema[query.type]

    if (nestedType.type === 'UnionTypeDefinition') {
      const unionQueries: string[] = []
      nestedType.types.forEach((type) => {
        const newNestedType = this.schema[type]

        unionQueries.push(createUnionQuery(newNestedType, this.schema, type))
      })

      return createQueryString({
        fields: unionQueries,
        queryHeader: queryHeader,
        isMutation,
        name,
        operationName,
        variables: this.arguments[query.name],
      })
    } else {
      const fields: string[] = []
      return nestedType.fields.map((field) => {
        const createdField = getField(field, this.schema)
        if (createdField) {
          fields.push(createdField)
        }

        return createQueryString({
          fields,
          queryHeader: queryHeader,
          isMutation,
          name,
          operationName,
          variables: this.arguments[query.name],
        })
      })
    }
  }
}
