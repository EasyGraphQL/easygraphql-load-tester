'use strict'

const fs = require('fs')
const path = require('path')
const LoadTesting = require('easygraphql-load-tester')
const { fileLoader } = require('merge-graphql-schemas')

const schema = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
const queries = fileLoader(path.join(__dirname, './graphql'))

const args = {
  searchUser: {
    name: 'demo',
  },
}

const easyGraphQLLoadTester = new LoadTesting(schema, args)

easyGraphQLLoadTester.k6('k6.js', {
  customQueries: queries,
  selectedQueries: ['getFamilyInfo', 'searchUser'],
  vus: 10,
  duration: '10s',
  queryFile: true,
  out: ['json=my_test_result.json'],
})
