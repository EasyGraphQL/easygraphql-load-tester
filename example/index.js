'use strict'

const fs = require('fs')
const path = require('path')
const EasyGraphQLLoadTester = require('../lib')

const familySchema = fs.readFileSync(path.join(__dirname, 'family.gql'), 'utf8')

const args = {
  getFamilyInfoByIsLocal: {
    isLocal: true,
    test: '["a", "b"]',
    age: 10,
    name: 'test'
  },
  searchUser: {
    name: 'demo'
  }
}

const automaticEGQL = new EasyGraphQLLoadTester(familySchema, args)

const queries = [
  {
    name: 'searchUser(name: "demo")',
    query: `
      {
        searchUser(name: "demo") {
          name
        }
      }
    `
  }
]

const testCases = automaticEGQL.artillery(queries)

module.exports = {
  testCases
}
