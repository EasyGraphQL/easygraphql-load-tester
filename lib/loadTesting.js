'use strict'

const schemaParser = require('easygraphql-parser')
const { getField, createQueryArguments } = require('../util')

class LoadTesting {
  constructor (schema, args = {}) {
    if (!schema) {
      throw new Error('The schema is require')
    }

    this.schema = schemaParser(schema)
    this.arguments = args
  }

  createQuery () {
    const queries = []

    this.schema.Query.fields.forEach(query => {
      const nestedType = this.schema[query.type]
      const fields = []
      nestedType.fields.forEach(field => {
        const createdField = getField(field, this.schema)
        fields.push(createdField)

        let queryHeader
        if (query.arguments.length) {
          const createdArgs = createQueryArguments(query.arguments, this.arguments[query.name])
          queryHeader = `${query.name}(${createdArgs})`
        } else {
          queryHeader = query.name
        }

        const queryFields = fields.join(' ')

        const newQuery = `
          {
            ${queryHeader} {
              ${queryFields}
            }
          }
        `

        const queryToTest = {
          name: queryHeader,
          query: newQuery
        }

        queries.push(queryToTest)
      })
    })

    return queries
  }

  artillery () {
    return (context, events, done) => {
      const queries = this.createQuery()
      context.vars['cases'] = queries
      return done()
    }
  }
}

module.exports = LoadTesting
