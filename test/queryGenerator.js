/* eslint-env mocha */
/* eslint-disable no-new, no-unused-expressions */
'use strict'

const fs = require('fs')
const path = require('path')
const { expect } = require('chai')
const EasyGraphQLTester = require('../lib')

const schema = fs.readFileSync(path.join(__dirname, 'schema', 'schema.gql'), 'utf8')

describe('Query generator', () => {
  it('Should initialize constructor', () => {
    const args = {
      getUserByUsername: {
        username: 'Test',
        id: 1
      }
    }
    const loadTest = new EasyGraphQLTester(schema, args)

    const queries = loadTest.createQuery()

    expect(queries).to.exist
    expect(queries).to.be.a('array')
    expect(queries[0].name).to.includes('getMe')
    expect(queries[queries.length - 1].name).to.includes('getUserByUsername')
  })

  it('Should throw an error if a arg is not defined', () => {
    let error 
    try {
      const args = {
        getUserByUsername: {
          username: 'Test'
        }
      }
      
      const loadTest = new EasyGraphQLTester(schema, args)
      loadTest.createQuery()
    } catch (err) {
      error = err
    }
    
    expect(error).to.exist
    expect(error.message).to.be.eq('id is required and it is not defined')
  })
})
