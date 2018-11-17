/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

'use strict'

const fs = require('fs')
const path = require('path')
const { expect } = require('chai')
const schemaParser = require('../lib/schemaParser')

const schemaCode = fs.readFileSync(path.join(__dirname, 'schema', 'schema.gql'), 'utf8')

describe('Parse GraphQL schema into an object', () => {
  let schema

  before(() => {
    schema = schemaParser(schemaCode)
  })

  describe('schemaDefinition', () => {
    it('Schema should have the Query property', () => {
      expect(schema).to.exist
      expect(schema.Query).to.exist
    })
  })

  describe('Type Me', () => {
    it('Schema should have the type Me', () => {
      expect(schema.Me).to.exist
      expect(schema.Me.type).to.be.eq('ObjectType')
      expect(schema.Me.description).to.be.eq(undefined)
      expect(schema.Me.fields.length).to.be.gt(0)
      expect(schema.Me.fields.length).to.be.eq(9)
    })

    it('Schema should have the properties with the null type and array type', () => {
      expect(schema.Me.fields).to.have.deep.include({ name: 'id', type: 'ID', noNull: true, isArray: false, arguments: [] })
      expect(schema.Me.fields).to.have.deep.include({ name: 'email', type: 'String', noNull: false, isArray: false, arguments: [] })
      expect(schema.Me.fields).to.have.deep.include({ name: 'username', type: 'String', noNull: true, isArray: true, arguments: [] })
      expect(schema.Me.fields).to.have.deep.include({ name: 'fullName', type: 'String', noNull: true, isArray: false, arguments: [] })
      expect(schema.Me.fields).to.have.deep.include({ name: 'phone', type: 'Int', noNull: true, isArray: true, arguments: [] })
      expect(schema.Me.fields).to.have.deep.include({ name: 'apiKey', type: 'String', noNull: true, isArray: false, arguments: [] })
    })
  })

  describe('Type User', () => {
    it('Schema should have the type User', () => {
      expect(schema.User).to.exist
      expect(schema.User.type).to.be.eq('ObjectType')
      expect(schema.User.description).to.be.eq(undefined)
      expect(schema.User.fields.length).to.be.gt(0)
      expect(schema.User.fields.length).to.be.eq(5)
    })

    it('Schema should have the properties with the null type and array type', () => {
      expect(schema.User.fields).to.have.deep.include({ name: 'email', type: 'String', noNull: true, isArray: false, arguments: [] })
      expect(schema.User.fields).to.have.deep.include({ name: 'username', type: 'String', noNull: true, isArray: false, arguments: [] })
      expect(schema.User.fields).to.have.deep.include({ name: 'fullName', type: 'String', noNull: true, isArray: false, arguments: [] })
      expect(schema.User.fields).to.have.deep.include({ name: 'phone', type: 'String', noNull: true, isArray: false, arguments: [] })
    })
  })

  describe('Type Query', () => {
    it('Schema should have the type Query with all the queries', () => {
      expect(schema.Query).to.exist
      expect(schema.Query.type).to.be.eq('ObjectType')
      expect(schema.Query.description).to.be.eq(undefined)
      expect(schema.Query.fields.length).to.be.gt(0)
      expect(schema.Query.fields.length).to.be.eq(2)
    })

    it('Schema should have the properties with the null type and array type', () => {
      const getUserByUsernameArguments = [{ name: 'username', noNull: true, isArray: false, type: 'String' }, { name: 'id', noNull: true, isArray: false, type: 'Int' }]
      expect(schema.Query.fields).to.have.deep.include({ name: 'getMe', type: 'Me', noNull: false, isArray: false, arguments: [] })
      expect(schema.Query.fields).to.have.deep.include({ name: 'getUserByUsername', type: 'User', noNull: false, isArray: false, arguments: getUserByUsernameArguments })
    })
  })
})
