import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import LoadTesting from '../src'

const schema = fs.readFileSync(
  path.join(__dirname, 'schema', 'schema.gql'),
  'utf8'
)

describe('Constructor', () => {
  it('Should fail if the schema is missing', () => {
    let error
    try {
      new LoadTesting(undefined as any, undefined as any)
    } catch (err) {
      error = err
    }

    expect(error).to.be.an.instanceOf(Error)
    expect(error.message).to.be.eq('The schema is required')
  })

  it('Should fail if the schema is null', () => {
    let error
    try {
      new LoadTesting(undefined as any)
    } catch (err) {
      error = err
    }

    expect(error).to.be.an.instanceOf(Error)
    expect(error.message).to.be.eq('The schema is required')
  })

  it('Should initialize constructor', () => {
    const tester = new LoadTesting(schema)

    expect(tester).to.exist
  })
})
