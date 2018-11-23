'use strict'

const schemaParser = require('easygraphql-parser')
const { getField, createQueryArguments, createUnionQuery, createQueryToTest } = require('../util')

class LoadTesting {
  constructor (schema, args = {}) {
    if (!schema) {
      throw new Error('The schema is require')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
  }

  createQuery (queries) {
    queries = queries || []

    this.schema.Query.fields.forEach(query => {
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

  artillery (customQueries) {
    return (context, events, done) => {
      const queries = this.createQuery(customQueries)
      context.vars['cases'] = queries
      return done()
    }
  }
}

module.exports = LoadTesting
