/* eslint-env mocha */
/* eslint-disable no-new, no-unused-expressions */
'use strict'

const fs = require('fs')
const path = require('path')
const { expect } = require('chai')
const EasyGraphQLTester = require('../lib')

const schema = fs.readFileSync(
  path.join(__dirname, 'schema', 'schema.gql'),
  'utf8'
)
const search = fs.readFileSync(
  path.join(__dirname, 'schema', 'search.gql'),
  'utf8'
)

describe('Query generator', () => {
  it('Should initialize constructor', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      getUser: {
        where: {
          id: '1',
          name: 'demo',
        },
      },
      isAdmin: {
        username: 'test',
      },
    }
    const loadTest = new EasyGraphQLTester(schema, args)

    const queries = loadTest.createQuery()

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getMe')
    expect(queries[queries.length - 1].name).to.includes('getUser')
    expect(queries[queries.length - 1].name).to.includes('where: {')
  })

  it('Should initialize constructor with custom query', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      getUser: {
        where: {
          id: '1',
          name: 'demo',
        },
      },
      isAdmin: {
        username: 'test',
      },
      createUser: {
        input: {
          name: 'test',
          email: 'test@test.com',
        },
      },
    }
    const loadTest = new EasyGraphQLTester(schema, args)

    const myQueries = [
      {
        name: 'myNewQuery',
        query: `{
          myNewQuery {
            test
          }
        }`,
      },
    ]
    const queries = loadTest.createQuery(myQueries, null, true)

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('myNewQuery')
    expect(queries[1].name).to.includes('getMe')
    expect(queries[queries.length - 1].name).to.includes('createUser')
  })

  it('Should initialize constructor with selectedQueries queries', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      isAdmin: {
        username: 'test',
      },
    }
    const loadTest = new EasyGraphQLTester(schema, args)

    const queries = loadTest.createQuery(null, ['getUserByUsername'])

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getUserByUsername')
    expect(queries[1].name).to.includes('getUserByUsername')
    expect(queries[queries.length - 1].name).to.includes('getUserByUsername')
  })

  it('Should support union', () => {
    const args = {
      search: {
        name: 'Test',
      },
    }
    const loadTest = new EasyGraphQLTester(search, args)

    const queries = loadTest.createQuery()

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('search')
    expect(queries[0].query).to.includes('... on Family')
    expect(queries[0].query).to.includes('... on User')
  })

  it('Should throw an error if a arg is not defined', () => {
    let error
    try {
      const args = {
        getUserByUsername: {
          username: 'Test',
        },
      }

      const loadTest = new EasyGraphQLTester(schema, args)
      loadTest.createQuery()
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq(
      'Failed to create query arguments for getUserByUsername\nError: All required query arguments must be defined - missing id'
    )
  })

  it('Should throw an error if a arg is not defined', () => {
    let error
    try {
      const args = {}

      const loadTest = new EasyGraphQLTester(search, args)
      loadTest.createQuery()
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq(
      'Failed to create query arguments for search\nError: No query arguments defined'
    )
  })

  it('Should throw an error if the name is missing k6', () => {
    let error
    try {
      const args = {
        getUserByUsername: {
          username: 'Test',
          id: 1,
        },
        getUser: {
          where: {
            id: '1',
            name: 'demo',
          },
        },
      }

      const loadTest = new EasyGraphQLTester(schema, args)
      loadTest.k6(null)
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq('The k6 file name is missing')
  })

  it('Should run k6', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      getUser: {
        where: {
          id: '1',
          name: 'demo',
        },
      },
      isAdmin: {
        username: 'test',
      },
    }

    const loadTest = new EasyGraphQLTester(schema, args)
    loadTest.k6('test.js')
  })
})
