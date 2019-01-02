'use strict'

const { getField, createQueryArguments, createUnionQuery, createQueryToTest } = require('./util')

function create (schema, query, selectedQueries, args, isMutation) {
  if (selectedQueries.length) {
    const isQueryToTest = selectedQueries.indexOf(query.name)
    if (isQueryToTest < 0) return
  }

  let queryHeader
  if (query.arguments.length) {
    const createdArgs = createQueryArguments(query.arguments, args[query.name])
    queryHeader = `${query.name}(${createdArgs})`
  } else {
    queryHeader = query.name
  }

  const queriesToTest = []
  if (['ID', 'String', 'Int', 'Float', 'Boolean'].indexOf(query.type) >= 0) {
    const queryToTest = createQueryToTest([], queryHeader, isMutation)
    queriesToTest.push(queryToTest)
    return queriesToTest
  }

  const nestedType = schema[query.type]
  const fields = []

  if (nestedType.type === 'UnionTypeDefinition') {
    const unionQueries = []
    nestedType.types.forEach(type => {
      const newNestedType = schema[type]

      unionQueries.push(createUnionQuery(newNestedType, schema, type))
    })

    const queryToTest = createQueryToTest(unionQueries, queryHeader, isMutation)

    queriesToTest.push(queryToTest)
  } else {
    nestedType.fields.forEach(field => {
      const createdField = getField(field, schema)
      fields.push(createdField)

      const queryToTest = createQueryToTest(fields, queryHeader, isMutation)

      queriesToTest.push(queryToTest)
    })
  }

  return queriesToTest
}

module.exports = create
