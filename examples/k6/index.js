'use strict'

const fs = require('fs')
const path = require('path')
const LoadTesting = require('../../lib')

const familySchema = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')

const args = {
  getFamilyInfoByIsLocal: {
    isLocal: true,
    test: ['a', 'b'],
    age: 10,
    name: 'test',
  },
  searchUser: {
    name: 'demo',
  },
}

const easyGraphQLLoadTester = new LoadTesting(familySchema, args)

const queries = [
  `
    query SEARCH_USER($name: String!) {
      searchUser(name: $name) {
        name
      }
    }
  `,
]

easyGraphQLLoadTester.k6('k6.js', {
  customQueries: queries,
  selectedQueries: ['getFamilyInfo', 'searchUser'],
  vus: 10,
  duration: '10s',
  queryFile: true,
  out: ['json=my_test_result.json'],
})
