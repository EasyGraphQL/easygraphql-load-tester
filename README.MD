<h1 align="center">
  <img src="https://raw.githubusercontent.com/EasyGraphQL/easygraphql-now/master/logo.png" alt="EasyGraphQL Mock " width="350">
  <br>
    easygraphql-load-tester
  <br>
  <br>
</h1>

easygraphql-load-tester is node library created to make load testing on GraphQL based on the schema; 
it'll create a bunch of queries, that are going to be the ones used to test your server.

## How to use it

[![Greenkeeper badge](https://badges.greenkeeper.io/EasyGraphQL/easygraphql-load-tester.svg)](https://greenkeeper.io/)

`easygraphql-load-tester` can be used in two ways for the moment; the first one is 
using `.artillery()` with a [artillery](https://artillery.io) setup, or the second 
one is `.createQuery()` that'll create the queries, so you can use with your favorite load tester.

+ Import `easygraphql-load-tester` package.
+ Read the schema.
+ Initialize the tester, and pass the schema as the first argument.
  + If there are multiples schemas pass an array with the schemas an argument.
  + **Note**: In order to use multiples schema files, the queries and mutations must be extended.  + 
+ The second argument is the arguments on the queries, **only** if there are some of them.
  + **Note**: If an argument is an array it should be passed as an `string`, e.g: `'["name", "name 2"]'`


### One schema file
```js
'use strict' 

const EasyGraphQLLoadTester = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const userSchema = fs.readFileSync(path.join(__dirname, 'schema', 'user.gql'), 'utf8')

const loadTester = new EasyGraphQLLoadTester(userSchema)
```

### Multiples schemas files
```js
'use strict' 

const EasyGraphQLLoadTester = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const userSchema = fs.readFileSync(path.join(__dirname, 'schema', 'user.gql'), 'utf8')
const familySchema = fs.readFileSync(path.join(__dirname, 'schema', 'family.gql'), 'utf8')

const loadTester = new EasyGraphQLLoadTester([userSchema, familySchema])
```

## Artillery

To use with [artillery](https://artillery.io), you must have it installed, in case you don't have it
just run:

```shell
$ npm install artillery -g
```

### index.js
You should configure your `index.js` file:

```js
'use strict' 

const EasyGraphQLLoadTester = require('easygraphql-load-tester')
const fs = require('fs')
const path = require('path')

const userSchema = fs.readFileSync(path.join(__dirname, 'schema', 'user.gql'), 'utf8')
const familySchema = fs.readFileSync(path.join(__dirname, 'schema', 'family.gql'), 'utf8')


const args = {
  getMeByTestResult: {
    result: 4
  },
  search: {
    id: '1'
  },
  searchUser: {
    where: {
      id: '1',
      name: 'demo'
    }
  }
}

const loadTester = new EasyGraphQLLoadTester([userSchema, familySchema], args)

const testCases = loadTester.artillery()

module.exports = {
  testCases
}
```

#### Custom queries
You can pass custom queries to test on your load test, to do it, you must create an
array of objects:

```js
const queries = [
  {
    name: '<NAME_OF_QUERY_TO_TEST>',
    query: '<YOUR_CUSTOM_QUERY>'
  }
]

```

and then pass it as the first argument to `loadTester.artillery(queries)`.
the query arguments object so the other queries can access them.

##### Example:

```js
const queries = [
  {
    name: 'searchUser(id: "1")',
    query: `
      {
        searchUser(id: "1") {
          name
        }
      }
    `
  }
]

const testCases = automaticEGQL.artillery(queries)
```

### artillery.yml
The artillery file should have this minimum configuration, you can add yours in case it is needed:

```yml
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
*In this case the server is running on http://localhost:5000/*

### How to run it

To run your load test, just run:

```shell
$ artillery run artillery.yml
```

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
