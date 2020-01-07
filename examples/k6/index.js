'use strict'

const fs = require('fs')
const path = require('path')
const LoadTesting = require('../../lib')

const familySchema = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')
const queries = fileLoader(path.join(__dirname, './graphql', '**/*.graphql'))

const args = {
  SEARCH_USER: [
    {
      name: 'bar',
    },
    {
      name: 'foo',
    },
  ],
}

const easyGraphQLLoadTester = new LoadTesting(familySchema, args)

easyGraphQLLoadTester.k6('k6.js', {
  customQueries: queries,
  selectedQueries: ['getFamilyInfo', 'searchUser'],
  vus: 10,
  duration: '10s',
  queryFile: true,
  out: ['json=my_test_result.json'],
})
