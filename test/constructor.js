/* eslint-env mocha */
/* eslint-disable no-new, no-unused-expressions */
'use strict'

const fs = require('fs')
const path = require('path')
const { expect } = require('chai')
const EasyGraphQLTester = require('../lib')

const schema = fs.readFileSync(path.join(__dirname, 'schema', 'schema.gql'), 'utf8')

describe('Constructor', () => {
  it('Should fail if the schema is missing', () => {
    let error
    try {
      new EasyGraphQLTester()
    } catch (err) {
      error = err
    }

    expect(error).to.be.an.instanceOf(Error)
    expect(error.message).to.be.eq('The schema is required')
  })

  it('Should fail if the schema is null', () => {
    let error
    try {
      new EasyGraphQLTester(null)
    } catch (err) {
      error = err
    }

    expect(error).to.be.an.instanceOf(Error)
    expect(error.message).to.be.eq('The schema is required')
  })

  it('Should initialize constructor', () => {
    const tester = new EasyGraphQLTester(schema)

    expect(tester).to.exist
  })
})
