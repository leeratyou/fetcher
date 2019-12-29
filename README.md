# @supersimplethings/fetchme
![npm (scoped)](https://img.shields.io/npm/v/@supersimplethings/fetchme)

> Things should be simple to use

Polite fetch library.

## Usage

```javascript
async function getResponse(someArgs) {
  const body = {
    some: someArgs.some,
    args: someArgs.args
  }
  const response = await fetchme().post(body).to('https://some.site/endpoint').plz()
}
```

## Installation

With [npm](https://npmjs.org/):

```shell
npm install @supersimplethings/fetchme
```

With [yarn](https://yarnpkg.com/en/):

```shell
yarn add @supersimplethings/fetchme
```

## API

```typescript
enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

enum MiddlewareTarget {
  response = 'response',
  body = 'body'
}

interface Api {
  name: string
  domain: string
  endpoints: object
}

interface Options {
  // TODO Under construction (of all Request options)
  headers?: object
}

interface Result {
  success: boolean
  data: any
}

interface Success extends Result {
  success: true
  data: any
}

interface Error extends Result {
  success: false
  data: any
}

interface Fetchme {
  constructor(Api)

  get(query?: object): this
  post(body: object): this
  put(body: object): this
  delete(): this

  from(urlOrEndpoint: string): this
  to(urlOrEndpoint: string): this

  with(options: Options): this
  addMiddleware(to: MiddlewareTarget, middleware: Function | Function[]): this

  plz(): Promise<Success|Error>
}
```

## Advanced usage

```javascript
const ourApi = {
  name: 'ourApi',
  domain: 'https://some.domain',
  endpoints: {
    userById: userId => `/users/${userId}`
  }
}

const token = 'some_token'

class Repository {
  constructor(apis) {
    const fetchme = new Fetchme(apis)
    fetchme.with({ headers: { Authorization: `Bearer ${token}` }})
    this.fetchme = fetchme
  }

  getUserById = async id => {
    const user = await this.fetchme
  }

}

const repository = new Repository(ourApi)
```

## License

MIT
