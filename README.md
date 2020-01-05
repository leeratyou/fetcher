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

const fetchme = new Fetchme(ourApi)
  .setOptions({ headers: { Authorization: `Bearer: ${token}` }})
  .addMiddleware('body', someBodyParser)

async function updateUser(someArgs, userId) {
  const body = {
    some: someArgs.some,
    args: someArgs.args
  }
  const user = await fetchme.put(body).to('ourApi').userById.with(userId).plz()
}

```

## Repository pattern
```javascript
import { Fetchme, Repository } from '@supersimplethings/fetchme'

class UsersRepository extends Repository {
  constructor(apis, Fetcher) {
    super(apis, Fetcher)

    this.apis = apis
    this.fetcher = new Fetcher(apis)
      .setOptions({ headers: { Authorization: `Bearer: ${token}` }})
      .addMiddleware('body', someBodyParser)
  }

  async createUser(someArgs) {
    const body = {
      some: someArgs.some,
      args: someArgs.args
    }
    const response = await this.fetcher.post(body).to().user.create.plz()

    if (!response.success) return []
    const newUser = someParse(response.data)
    return newUser
  }
}

const ourApi = {
  name: 'ourApi',
  domain: 'https://some.domain',
  endpoints: {
    user: {
      create: () => '/users'
    }
  }
}

const usersRepository = new UsersRepository(ourApi, Fetchme)

```

## License

MIT
