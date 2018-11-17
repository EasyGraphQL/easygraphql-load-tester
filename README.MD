<h1 align="center">
  <img src="https://cdn.rawgit.com/EasyGraphQL/easygraphql-mock/baab331c/EasyGraphQL.png" alt="EasyGraphQL Mock " width="350">
  <br>
  EasyGraphQL Load Tester 
  <br>
  <br>
</h1>

easygraphql-load-tester will create multiple queries that can be used with your favorite load testing library.

## How to use it

### install

```bash
$ npm install --save easygraphql-load-tester
```

To use it, you must have your server running and follow the next steps:

1. Initialize the class, pass the schema and export test cases
   ```js
    'use strict'

    const fs = require('fs')
    const path = require('path')
    const EasyGraphQLLoadTester = require('easygraphql-load-tester')

    const schema = fs.readFileSync(path.join(__dirname, 'schema.gql'), 'utf8')

    const args = {
      getFamilyInfo: {
        isLocal: true,
        lastNames: '["test 1", "test 2"]',
        age: 20,
        name: 'test'
      }
    }

    const loadTester = new EasyGraphQLLoadTester(schema, args)
    const testCases = loadTester.createQuery()

    module.exports = {
      testCases
    }
   ```

  If the Query receives arguments, those should be defined and pass to the class as second arg.

  *If the arg is array it should be added as string `'["test 1", "test 2"]'`*

2. Using Artillery.io
  Install [Artillery.io](https://artillery.io/)
  create `yaml` file like this:
  
  ```yaml
    config:
      target: "http://localhost:5000/"
      phases:
        - duration: 5
          arrivalRate: 1
      processor: "./index.js"
    scenarios:
      - name: "GraphQL Query load test"
        flow:
          - function: "testCases"
          - loop:
              - post:
                  url: "/"
                  json:
                    query: "{{ $loopElement.query }}"
              - log: "----------------------------------"
              - log: "Sent a request to the Query: {{ $loopElement.name }}"
            over: cases
  ```

## Example
You can check the [example](https://github.com/EasyGraphQL/easygraphql-load-tester/tree/master/example)

# License
### The MIT License

Copyright (c) 2018 EasyGraphQL

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
