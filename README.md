# @supersimplethings/fetcher
![npm (scoped)](https://img.shields.io/npm/v/@supersimplethings/fetcher)

> Things should be simple to use

Polite fetch library.

## Usage

```javascript
async function getResponse(someArgs) {
  const body = {
    some: someArgs.some,
    args: someArgs.args
  }
  const response = await fetcher().post(body).to('https://some.site/endpoint').plz()
}
```

## Installation

With [npm](https://npmjs.org/):

```shell
npm install @supersimplethings/fetcher
```

With [yarn](https://yarnpkg.com/en/):

```shell
yarn add @supersimplethings/fetcher
```

## Advanced usage

```javascript
import { Fetcher, MiddlewareTarget } from '@supersimplethings/fetcher'

const ourApi = {
  name: 'ourApi',
  domain: 'https://some.domain',
  endpoints: {
    user:{
      byId: userId => `/users/${userId}`
    }
  }
}

const token = 'some_token'

const fetcher = new Fetcher(ourApi)
  .useApi('ourApi')
  .setOptions({ headers: { Authorization: `Bearer: ${token}` }})
  .useMiddleware(MiddlewareTarget.body, someBodyParser)

async function updateUser(someArgs, userId) {
  const body = {
    some: someArgs.some,
    args: someArgs.args
  }
  const user = await fetcher.put(body).to().user.byId.with(userId).plz()
}

```

## Default middleware
You can override default behaviour with `useMiddleware` method:

```typescript
useMiddleware(on: MiddlewareTarget, middleware: Middleware[]): Fetcher {
  this.middleware[on] = middleware
  return this
}

enum MiddlewareTarget {
  response = 'response',
  body = 'body',
  resolve = 'resolve',
  reject = 'reject'
}
```

Defaults are:
```typescript
middleware: Middleware = {
  body: [stringify],
  response: [statusNotOk, takeJson],
  resolve: [success],
  reject: [error],
}
```

## License

MIT
