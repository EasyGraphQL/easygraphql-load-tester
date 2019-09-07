'use strict'

const fs = require('fs')
const path = require('path')
const schemaParser = require('easygraphql-parser')
const { spawn } = require('child_process')
const create = require('../utils')
const { queryField, mutationField } = require('../utils/schemaDefinition')

class LoadTesting {
  constructor (schema, args = {}) {
    if (!schema) {
      throw new Error('The schema is required')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
  }

  createQuery (queries, selectedQueries, withMutations) {
    queries = queries || []
    selectedQueries = selectedQueries || []

    const Query = queryField(this.schema)
    this.schema[Query].fields.forEach(query => {
      const createdQueries = create(
        this.schema,
        query,
        selectedQueries,
        this.arguments
      )
      if (createdQueries && createdQueries.length > 0) {
        queries.push(...createdQueries)
      }
    })

    if (withMutations) {
      const Mutation = mutationField(this.schema)
      this.schema[Mutation].fields.forEach(mutation => {
        const createdQueries = create(
          this.schema,
          mutation,
          selectedQueries,
          this.arguments,
          true
        )
        if (createdQueries && createdQueries.length > 0) {
          queries.push(...createdQueries)
        }
      })
    }

    return queries
  }

  artillery (options = {}) {
    const {
      customQueries,
      selectedQueries,
      queryFile,
      queryFilePath,
      withMutations
    } = options

    const queries = this.createQuery(
      customQueries,
      selectedQueries,
      withMutations
    )

    if (queryFile) {
      const queryFileName = 'easygraphql-load-tester-queries.json'
      const filePath = queryFilePath
        ? path.join(queryFilePath, queryFileName)
        : path.join(path.resolve(), queryFileName)

      fs.writeFileSync(filePath, JSON.stringify(queries))
    }

    return (context, events, done) => {
      context.vars["cases"] = queries; // eslint-disable-line
      return done()
    }
  }

  k6 (fileName, options = {}) {
    if (!fileName) {
      throw new Error('The k6 file name is missing')
    }
    const queryFileName = 'easygraphql-load-tester-queries.json'

    const {
      customQueries,
      selectedQueries,
      vus,
      duration,
      queryFile,
      withMutations
    } = options

    const queries = this.createQuery(
      customQueries,
      selectedQueries,
      withMutations
    )
    const selectedVus = vus || ''

    const selectedDuration = duration || ''

    fs.writeFileSync(queryFileName, JSON.stringify(queries))

    const outArgs = options.out ? options.out.map(out => `--out ${out}`) : []

    const k6Process = spawn('k6 run', [...outArgs, fileName], {
      stdio: 'inherit',
      shell: true,
      env: {
        VUS: selectedVus,
        DURATION: selectedDuration
      }
    })

    k6Process.on('exit', () => {
      if (!queryFile) {
        fs.unlinkSync(queryFileName)
      }
    })
  }
}

module.exports = LoadTesting
