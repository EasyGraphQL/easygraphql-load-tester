'use strict'

const fs = require('fs')
const path = require('path')
const schemaParser = require('easygraphql-parser')
const { spawn } = require('child_process')
const flatten = require('lodash.flatten')
const { parse, getOperationAST } = require('graphql')
const {
  getField,
  createQueryArguments,
  createUnionQuery,
  createQueryToTest,
} = require('../utils/util')

class LoadTesting {
  constructor(schema, args = {}) {
    if (!schema) {
      throw new Error('The schema is required')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
    this.queryField = schema.schemaDefinition
      ? schema.schemaDefinition.query.field
      : 'Query'
    this.mutationField = schema.schemaDefinition
      ? schema.schemaDefinition.mutation.field
      : 'Mutation'
  }

  artillery(options = {}) {
    const {
      customQueries,
      onlyCustomQueries,
      selectedQueries,
      queryFile,
      queryFilePath,
      withMutations,
    } = options

    const queries = this.createQueries(
      customQueries,
      selectedQueries,
      withMutations,
      onlyCustomQueries
    )

    if (queryFile) {
      const queryFileName = 'easygraphql-load-tester-queries.json'
      const filePath = queryFilePath
        ? path.join(queryFilePath, queryFileName)
        : path.join(path.resolve(), queryFileName)

      fs.writeFileSync(filePath, JSON.stringify(queries))
    }

    return (context, events, done) => {
      context.vars['cases'] = queries // eslint-disable-line
      return done()
    }
  }

  k6(fileName, options = {}) {
    if (!fileName) {
      throw new Error('The k6 file name is missing')
    }
    const queryFileName = 'easygraphql-load-tester-queries.json'

    const {
      customQueries,
      onlyCustomQueries,
      selectedQueries,
      vus,
      duration,
      queryFile,
      withMutations,
    } = options

    const queries = this.createQueries(
      customQueries,
      selectedQueries,
      withMutations,
      onlyCustomQueries
    )
    const selectedVus = vus || ''

    const selectedDuration = duration || ''

    fs.writeFileSync(queryFileName, JSON.stringify(queries))

    const outArgs = options.out ? options.out.map((out) => `--out ${out}`) : []

    const k6Process = spawn('k6 run', [...outArgs, fileName], {
      stdio: 'inherit',
      shell: true,
      env: {
        VUS: selectedVus,
        DURATION: selectedDuration,
      },
    })

    k6Process.on('exit', () => {
      if (!queryFile) {
        fs.unlinkSync(queryFileName)
      }
    })
  }

  createQueries(queries, selectedQueries, withMutations, onlyCustomQueries) {
    queries = queries || []
    selectedQueries = selectedQueries || []

    if (!(Array.isArray(queries) && Array.isArray(selectedQueries))) {
      throw new Error('Custom queries and selected queries should be an array')
    }

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

    if (onlyCustomQueries) {
      queries = queries.map((query) => {
        const parsedQuery = parse(query)
        const operationNode = getOperationAST(parsedQuery)

        const name =
          operationNode && operationNode.name
            ? operationNode.name.value
            : operationNode.selectionSet.selections[0].name.value

        return {
          name,
          operation: operationNode && operationNode.operation,
          query,
          variables: this.arguments[name],
        }
      })

      if (selectedQueries) {
        queries = queries.filter((query) => {
          for (let i = 0; i < selectedQueries.length; i++) {
            if (query.name && query.name === selectedQueries[i]) return true
          }
        })
      }
    } else {
      schemaDefinitions.forEach((schemaDefinition) => {
        this.schema[schemaDefinition.definition].fields.forEach((query) => {
          if (
            !(selectedQueries.length && selectedQueries.indexOf(query.name) < 0)
          ) {
            queries.push(
              this.createOperation(query, schemaDefinition.isMutation)
            )
          }
        })
      })
    }

    return flatten(queries)
  }

  createOperation(query, isMutation) {
    let queryHeader = query.name
    let name = query.name
    if (query.arguments && query.arguments.length) {
      const createdArgs = createQueryArguments(
        query.arguments,
        this.arguments[query.name],
        query.name
      )

      if (createdArgs && createdArgs.length) {
        queryHeader = `${query.name}(${createdArgs})`
        name = `${query.name} with arguments: { ${createdArgs.toString()} }`
      }
    }

    // Check if the operation only request scalar type.
    if (['ID', 'String', 'Int', 'Float', 'Boolean'].indexOf(query.type) >= 0) {
      return createQueryToTest([], queryHeader, isMutation, name)
    }

    // Select the nested type from the object of types.
    const nestedType = this.schema[query.type]

    if (nestedType.type === 'UnionTypeDefinition') {
      const unionQueries = []
      nestedType.types.forEach((type) => {
        const newNestedType = this.schema[type]

        unionQueries.push(createUnionQuery(newNestedType, this.schema, type))
      })

      return createQueryToTest(unionQueries, queryHeader, isMutation, name)
    } else {
      const fields = []
      return nestedType.fields.map((field) => {
        const createdField = getField(field, this.schema)
        fields.push(createdField)

        return createQueryToTest(fields, queryHeader, isMutation, name)
      })
    }
  }
}

module.exports = LoadTesting
