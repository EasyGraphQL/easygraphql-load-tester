<h1 align="center">
  <img src="https://raw.githubusercontent.com/EasyGraphQL/easygraphql-now/master/logo.png" alt="easygraphql-load-tester " width="350">
  <br>
    easygraphql-load-tester
  <br>
  <br>
</h1>

easygraphql-load-tester is a node library created to make load
testing on GraphQL based on the schema; it'll create a bunch of queries, that
are going to be the ones used to test your server.

## Installation

To install the package on your project just run on the root of your project

```shell
$ npm install easygraphql-load-tester --saved-dev

$ yarn add easygraphql-load-tester -D
```

[`easygraphql-load-tester`](https://github.com/EasyGraphQL/easygraphql-load-tester)

## Supported packages

1. Using `.artillery()` with a [artillery](https://artillery.io) setup.
2. Using `.k6()` with a [k6](https://docs.k6.io/docs) setup.
3. Using `.createQuery()` that'll create the queries, so you can use with your favorite load tester.

## How to use it?

- Import [`easygraphql-load-tester`](https://github.com/EasyGraphQL/easygraphql-load-tester) package.
- Read the schema.
- Initialize the tester, and pass the schema as the first argument.
  - If there are multiples schemas pass an array with the schemas an argument.
  - **Note**: In order to use multiples schema files, the queries and mutations must be extended. +
- The second argument is the arguments on the queries, **only** if there are some of them.

### One schema file

```js
'use strict'

const LoadTesting = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const userSchema = fs.readFileSync(
  path.join(__dirname, 'schema', 'user.gql'),
  'utf8'
)

const loadTester = new LoadTesting(userSchema)
```

### Multiples schemas files

```js
'use strict'

const LoadTesting = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const userSchema = fs.readFileSync(
  path.join(__dirname, 'schema', 'user.gql'),
  'utf8'
)
const familySchema = fs.readFileSync(
  path.join(__dirname, 'schema', 'family.gql'),
  'utf8'
)

const loadTester = new LoadTesting([userSchema, familySchema])
```

### Using GraphQL.js

```js
'use strict'

const { GraphQLSchema, GraphQLObjectType, GraphQLString } = require('graphql')
const LoadTesting = require('easygraphql-load-tester')

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
      hello: {
        type: GraphQLString,
        resolve() {
          return 'world'
        },
      },
    },
  }),
})

const loadTester = new LoadTesting(schema)
```

## Artillery

To use with [artillery](https://artillery.io), you must have it installed in your project,
in case you don't have it just run:

```shell
$ npm install artillery --saved-dev
```

### index.js

You should configure your `index.js` file:

```js
''use strict'

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
  createUser: {
    name: 'demo',
  },
  createCity: {
    input: {
      name: 'demo',
      country: 'Demo',
    },
  },
}

const easyGraphQLLoadTester = new LoadTesting(familySchema, args)

const customQueries = [
  `
    query SEARCH_USER($name: String!) {
      searchUser(name: $name) {
        name
      }
    }
  `,
]

const testCases = easyGraphQLLoadTester.artillery({
  customQueries,
  onlyCustomQueries: true,
  queryFile: true,
  withMutations: true,
})

module.exports = {
  testCases,
}

```

### Artillery options

```ts
type ArtilleryOptions = {
  customQueries?: string[]
  onlyCustomQueries?: boolean
  selectedQueries?: string[]
  queryFile?: boolean
  queryFilePath?: string
  withMutations?: boolean
}
```

_This is optional, you can leave the second argument empty, if you don't want to pass any options_

#### Custom queries

You can pass custom queries to test on your load test. To create them, create
an array of strings (queries). You can use variables, and it's going to use the
variables defined on the arguments used to initialize `LoadTesting` or, you can
pass the value of the argument `searchUser(name: "demo") {...}`

```js
const customQueries = [
  `
    query SEARCH_USER($name: String!) {
      searchUser(name: $name) {
        name
      }
    }
  `,
]
```

#### Only custom queries

If this is set to `true` it's going to use the custom queries passed.

#### Selected queries

You can select a list of the queries you want to test, to do this, you must create an
array of strings with the name of the queries to test; this is optional, if you don't
create it, all the queries are going to be tested.

```js
const selectedQueries = ['getFamilyInfo', 'searchUser']
```

#### Query file

You can select, if you want to save a `json` file with all the queries that where tested,
to do it, on the options pass `queryFile: true`, if you don't pass anything it is not going
to be saved.

### Query file path

You can select the path that you want to use to save the query file, if it's not set
it'll use by default `path.resolve()`

#### Mutations

You can use [`easygraphql-load-tester`](https://github.com/EasyGraphQL/easygraphql-load-tester) to test
your mutations as well; to do it, on the options pass `withMutations: true`, if you don't pass anything it is only
going to test the queries.
_If you set `withMutations: true`, don't forget to add the input values on the args_

### artillery.yml

The artillery file should have this minimum configuration, you can add yours in case it is needed:

```yml
config:
  target: 'http://localhost:5000/'
  phases:
    - duration: 5
      arrivalRate: 1
  processor: './index.js'
scenarios:
  - name: 'GraphQL Query load test'
    flow:
      - function: 'testCases'
      - loop:
          - post:
              url: '/'
              json:
                query: '{{ $loopElement.query }}'
                variables: '{{ $loopElement.variables }}'
          - log: '----------------------------------'
          - log: 'Sent a request to the {{ $loopElement.operation }}: {{ $loopElement.name }}'
          - log: 'And variables {{ $loopElement.variables }}'
        over: cases
```

_In this case the server is running on http://localhost:5000/_

### How to run it

To run your load test, add this script on your `package.json`:

```json
"scripts": {
  "easygraphql-load-tester": "artillery run artillery.yml"
}
```

and then run on the terminal

```shell
$ npm run easygraphql-load-tester
```

_In this case the artillery file is called artillery, but you can name yours with your favorite name and run `artillery run <MY_FILE_NAME>.yml`_

### Result

The result is going to be something like this if you apply the basic configuration

```shell
 All virtual users finished
 Summary report @ 15:03:05(-0500) 2018-11-17
   Scenarios launched:  5
   Scenarios completed: 5
   Requests completed:  40
   RPS sent: 8.95
   Request latency:
     min: 1.2
     max: 13
     median: 2
     p95: 6
     p99: 13
   Scenario counts:
     GraphQL Query load test: 5 (100%)
   Codes:
     200: 40
```

## k6

To use with [k6](https://docs.k6.io/docs/), you must have it installed on your computer,
in case you don't have it, visit the [installation guide](https://docs.k6.io/docs/installation)

### index.js

You should configure your `index.js` file:

```js
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
```

**The first argument is the name of the k6 configuration file**

### K6 options

```ts
type ArtilleryOptions = {
  customQueries?: string[]
  onlyCustomQueries?: boolean
  selectedQueries?: string[]
  queryFile?: boolean
  queryFilePath?: string
  withMutations?: boolean
  vus?: number
  duration?: string
  out?: string[]
}
```

_This is optional, you can leave the second argument empty, if you don't want to pass any options_

#### Custom queries

You can pass custom queries to test on your load test. To create them, create
an array of strings (queries). You can use variables, and it's going to use the
variables defined on the arguments used to initialize `LoadTesting` or, you can
pass the value of the argument `searchUser(name: "demo") {...}`

```js
const customQueries = [
  `
    query SEARCH_USER($name: String!) {
      searchUser(name: $name) {
        name
      }
    }
  `,
]
```

#### Only custom queries

If this is set to `true` it's going to use the custom queries passed.

#### Selected queries

You can select a list of the queries you want to test, to do this, you must create an
array of strings with the name of the queries to test; this is optional, if you don't
create it, all the queries are going to be tested.

```js
const selectedQueries = ['getFamilyInfo', 'searchUser']
```

#### Query file

You can select, if you want to save a `json` file with all the queries that where tested,
to do it, on the options pass `queryFile: true`, if you don't pass anything it is not going
to be saved.

#### Mutations

You can use [`easygraphql-load-tester`](https://github.com/EasyGraphQL/easygraphql-load-tester) to test
your mutations as well; to do it, on the options pass `withMutations: true`, if you don't pass anything it is only
going to test the queries.
_If you set `withMutations: true`, don't forget to add the input values on the args_

#### Virtual users

You can select how many virtual users do you want for your tests, just pass to the options
`vus: <NUMBER_OF_VUS>`.

#### Duration

You can select the duration for your tests, just pass to the options
`duration: '<DURATION>s'`. It should be a string with units of the time e.g. `s`

#### Out

You can also make k6 output detailed statistics in JSON format by using the --out/-o option for k6 run.
[More info](https://docs.k6.io/docs/results-output)

### k6.js

The k6 file should have this minimum configuration, you can add yours in case it is needed:

**Note: dont' change the name and the route of the queries `./easygraphql-load-tester-queries.json`**

```js
import http from 'k6/http'

const queries = JSON.parse(open('./easygraphql-load-tester-queries.json'))

export default function() {
  for (const query of queries) {
    const url = 'http://localhost:5000/'
    const payload = JSON.stringify({
      query: query.query,
      variables: query.variables,
    })
    const params = { headers: { 'Content-Type': 'application/json' } }
    http.post(url, payload, params)
  }
}
```

_In this case the server is running on http://localhost:5000/_

### How to run it

To run your load test, add this script on your `package.json`:

```json
"scripts": {
  "easygraphql-load-tester": "node index.js"
}
```

and then run on the terminal

```shell
$ npm run easygraphql-load-tester
```

## How to use it with your actual queries

1. Install in your project [`merge-graphql-schemas`](https://github.com/Urigo/merge-graphql-schemas)
2. Import all your queries:
   ```js
   const queries = fileLoader(path.join(__dirname, '..', '**/*.graphql'))
   ```
3. Pass them as `customQueries` in the options, with `onlyCustomQueries: true` as well.
4. Set in the args the values to used on the variables of the queries/mutations.

## Success cases

If you want to share your success case using [`easygraphql-load-tester`](https://github.com/EasyGraphQL/easygraphql-load-tester)
feel free to create a [PR](https://github.com/EasyGraphQL/easygraphql-load-tester/pulls) so the community
can learn from your story.

## Importance of using dataloaders

Some time ago I was working on a GraphQL project that includes activities and
each activity can have some comments with the info of the user that created the comment.
The first thing that you might think is that it is a problem of query n + 1 , and yes; it is!

I decided to implement dataloaders but for some reason, there was an error on the
implementation, so it wasn't caching the query and the result was a lot of
request to the database. After finding that issue I implemented it on the right
way reducing the queries to the database from 46 to 6.

### Results without dataloaders

```shell
All virtual users finished
Summary report @ 10:07:55(-0500) 2018-11-23
  Scenarios launched:  5
  Scenarios completed: 5
  Requests completed:  295
  RPS sent: 36.88
  Request latency:
    min: 1.6
    max: 470.9
    median: 32.9
    p95: 233.2
    p99: 410.8
  Scenario counts:
    GraphQL Query load test: 5 (100%)
  Codes:
    200: 295
```

### Results with dataloaders

```shell
All virtual users finished
Summary report @ 10:09:09(-0500) 2018-11-23
  Scenarios launched:  5
  Scenarios completed: 5
  Requests completed:  295
  RPS sent: 65.85
  Request latency:
    min: 1.5
    max: 71.9
    median: 3.3
    p95: 19.4
    p99: 36.2
  Scenario counts:
    GraphQL Query load test: 5 (100%)
  Codes:
    200: 295
```

## Examples

You can check the [example](https://github.com/EasyGraphQL/easygraphql-load-tester/tree/master/examples)

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
