import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import LoadTesting from '../src'

const schema = fs.readFileSync(
  path.join(__dirname, 'schema', 'schema.gql'),
  'utf8'
)
const search = fs.readFileSync(
  path.join(__dirname, 'schema', 'search.gql'),
  'utf8'
)

describe('Query generator', () => {
  it('should initialize constructor', () => {
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
    const loadTest = new LoadTesting(schema, args)

    const queries = loadTest.createQueries()

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getMe')
    expect(queries[queries.length - 1].name).to.includes('getUser')
    expect(queries[queries.length - 1].name).to.includes(
      'getUser with arguments: { where: $where }'
    )
  })

  it('should initialize constructor with custom query', () => {
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
    const loadTest = new LoadTesting(schema, args)

    const myQueries = [
      `{
          myNewQuery {
            test
          }
        }`,
    ]
    const queries = loadTest.createQueries({
      queries: myQueries,
      onlyCustomQueries: true,
    })

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('myNewQuery')
    expect(queries[0].operation).to.be.eq('query')
  })

  it('should initialize constructor with selectedQueries queries', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      isAdmin: {
        username: 'test',
      },
    }
    const loadTest = new LoadTesting(schema, args)

    const queries = loadTest.createQueries({
      selectedQueries: ['getUserByUsername'],
    })

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getUserByUsername')
    expect(queries[1].name).to.includes('getUserByUsername')
    expect(queries[queries.length - 1].name).to.includes('getUserByUsername')
  })

  it('should support union', () => {
    const args = {
      search: {
        name: 'Test',
      },
    }
    const loadTest = new LoadTesting(search, args)

    const queries = loadTest.createQueries()

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('search')
    expect(queries[0].query).to.includes('... on Family')
    expect(queries[0].query).to.includes('... on User')
  })

  it('should throw an error if a arg is not defined', () => {
    let error
    try {
      const args = {
        getUserByUsername: {
          username: 'Test',
        },
      }

      const loadTest = new LoadTesting(schema, args)
      loadTest.createQueries()
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq(
      'Error in getUserByUsername - All required query arguments must be defined - missing id'
    )
  })

  it('should throw an error if a arg is not defined', () => {
    let error
    try {
      const args = {}

      const loadTest = new LoadTesting(search, args)
      loadTest.createQueries()
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq(
      'Error in search - No query arguments defined'
    )
  })

  it('should throw an error if the name is missing k6', () => {
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

      const loadTest = new LoadTesting(schema, args)
      loadTest.k6(null as any)
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq('The k6 file name is missing')
  })

  it('should run k6', () => {
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

    const loadTest = new LoadTesting(schema, args)
    loadTest.k6('test.js')
  })

  it('should initialize constructor with only selectedQueries', () => {
    const customQuery = [
      `query GetUsername($username: String!){
        getUserByUsername(username: $username) {
          email
        }
      }`,
    ]
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1,
      },
      isAdmin: {
        username: 'test',
      },
    }
    const loadTest = new LoadTesting(schema, args)

    const queries = loadTest.createQueries({
      queries: customQuery,
      selectedQueries: ['getUserByUsername'],
      onlyCustomQueries: true,
    })

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getUserByUsername')
  })

  it('should create mutations', () => {
    const args = {
      createUser: {
        input: {
          name: 'demo',
          email: 'demo',
        },
      },
    }
    const loadTest = new LoadTesting(schema, args)

    const queries = loadTest.createQueries({
      selectedQueries: ['createUser'],
      withMutations: true,
    })

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes(
      'createUser with arguments: { input: $input }'
    )
  })

  it('should throw an error if custom queries is not an array', () => {
    let error
    try {
      const customQuery = `query GetUserByUsername {
        getUserByUsername(username: "test") {
          email
        }
      }`

      const args = {
        getUserByUsername: {
          username: 'Test',
          id: 1,
        },
        isAdmin: {
          username: 'test',
        },
      }
      const loadTest = new LoadTesting(schema, args)

      loadTest.createQueries({
        queries: customQuery as any,
        selectedQueries: ['getUserByUsername'],
        onlyCustomQueries: true,
      })
    } catch (err) {
      error = err
    }

    expect(error).to.exist
    expect(error.message).to.be.eq(
      'Custom queries and selected queries should be an array'
    )
  })
})
