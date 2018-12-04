'use strict'

const fs = require('fs')
const schemaParser = require('easygraphql-parser')
const { spawnSync } = require('child_process')
const { getField, createQueryArguments, createUnionQuery, createQueryToTest } = require('../util')

class LoadTesting {
  constructor (schema, args = {}) {
    if (!schema) {
      throw new Error('The schema is require')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
  }

  createQuery (queries, selectedQueries) {
    queries = queries || []
    selectedQueries = selectedQueries || []

    this.schema.Query.fields.forEach(query => {
      if (selectedQueries.length) {
        const isQueryToTest = selectedQueries.indexOf(query.name)
        if (isQueryToTest < 0) return
      }

      const nestedType = this.schema[query.type]
      const fields = []

      let queryHeader
      if (query.arguments.length) {
        const createdArgs = createQueryArguments(query.arguments, this.arguments[query.name])
        queryHeader = `${query.name}(${createdArgs})`
      } else {
        queryHeader = query.name
      }

      if (nestedType.type === 'UnionTypeDefinition') {
        const unionQueries = []
        nestedType.types.forEach(type => {
          const newNestedType = this.schema[type]

          unionQueries.push(createUnionQuery(newNestedType, this.schema, type))
        })

        const queryToTest = createQueryToTest(unionQueries, queryHeader)

        queries.push(queryToTest)
      } else {
        nestedType.fields.forEach(field => {
          const createdField = getField(field, this.schema)
          fields.push(createdField)

          const queryToTest = createQueryToTest(fields, queryHeader)

          queries.push(queryToTest)
        })
      }
    })

    return queries
  }

  artillery (options = {}) {
    const { customQueries, selectedQueries, queryFile } = options

    const queries = this.createQuery(customQueries, selectedQueries)

    if (queryFile) {
      const queryFileName = 'easygraphql-load-tester-queries.json'
      fs.writeFileSync(queryFileName, JSON.stringify(queries))
    }

    return (context, events, done) => {
      context.vars['cases'] = queries
      return done()
    }
  }

  k6 (fileName, options = {}) {
    if (!fileName) {
      throw new Error('The k6 file name is missing')
    }
    const queryFileName = 'easygraphql-load-tester-queries.json'

    const { customQueries, selectedQueries, vus, duration, queryFile } = options

    const queries = this.createQuery(customQueries, selectedQueries)
    const selectedVus = vus || ''

    const selectedDuration = duration || ''

    fs.writeFileSync(queryFileName, JSON.stringify(queries))

    spawnSync('k6 run', [fileName], {
      stdio: 'inherit',
      shell: true,
      env: {
        VUS: selectedVus,
        DURATION: selectedDuration
      }
    })

    if (!queryFile) {
      fs.unlinkSync(queryFileName)
    }
  }
}

module.exports = LoadTesting
