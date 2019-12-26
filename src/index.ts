import merge from 'deepmerge'

const pipe = (...fns: any[]) => (value: any) => fns.reduce((prevValue, currentFn) => currentFn(prevValue), value)

enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

interface Options {
  method: Method,
  body?: any,
  headers?: Dictionary<string>
}

const error = (e: string | object) => ({
  success: false,
  data: e
})

interface Api extends Dictionary<any> {
  name: string
  domain: string
  endpoints: object
}

type Dictionary<T> = { [key: string]: T }

enum MiddlewareTarget {
  response = 'response',
  body = 'body'
}

// TODO Under construction
type ValidateShape<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never

declare function setApis<T>(apis: ValidateShape<T, Api>): void

// TODO Under construction
// function isType<T>(input: any): input is T {
//
// }

// FIXME Fast but ugly
function isApi(input: any): input is Api {
  return (input.name && input.domain && input.endpoints)
}

function isApiDict(input: any): input is Dictionary<Api> {
  if (typeof input !== 'object' || Array.isArray(input)) return false
  
  // TODO Under construction
  if (typeof input === 'object') return !<boolean>Object.values(input).find((item: any) => !isApi(item))
  
  return false
}

function isFullUrl(input: string): boolean {
  return /^http/.test(input)
}

const convert = (converter: Function) => (input: any): any => {
  if (Array.isArray(input)) return input.map(item => convert(converter)(item))
  if (typeof input === 'object') return Object.entries(input)
    .reduce((obj, [key, value]) => ({ ...obj, [converter(key)]: convert(converter)(value) }), {})
  return input
}

class Fetchme {
  constructor(apis?: Api | Dictionary<Api>) {
    // TODO Under construction
    // TODO Need to be able pass string as well
    if (apis) this.setApis(apis)
  }
  
  private setApis(apis: Api | Dictionary<Api>) {
    // TODO Under construction
    if (isApi(apis)) {
      this.apis = {...this.apis, [apis.name]: apis}
    } else {
      this.apis = apis
    }
  }
  
  apis?: Dictionary<Api> = {}
  
  options: Options = {
    method: Method.GET,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }
  
  middlewares = {
    body: [],
    response: []
  }
  
  domain: string = ''
  endpoint: string = ''
  query: string = ''
  
  private fetch(url: string, options: any) {
    return new Promise((resolve, reject) => {
      fetch(url, options)
        .then((response: Response) => {
          if (!response.ok) throw ({ status: response.status, statusText: response.statusText })
          return response.json()
        })
        .then((json: unknown) => {
          if (this.middlewares.response.length > 0) {
            resolve(pipe(...this.middlewares.response)(json))
          } else {
            resolve(json)
          }
        })
        .catch((e: any) => {
          reject(error(e))
        })
    })
  }
  
  // TODO Make mapper use this.apis
  private mapper(url: string) {
    const parsed = new URL(url)
    this.domain = parsed.origin
    this.endpoint = parsed.pathname
  }
  
  // TODO Always pass through mapper
  from(endpoint: string) {
    if (isFullUrl(endpoint)) {
      this.mapper(endpoint)
    } else {
      this.endpoint = endpoint
    }
    return this
  }
  
  // TODO Always pass through mapper
  to(endpoint: string) {
    if (isFullUrl(endpoint)) {
      this.mapper(endpoint)
    } else {
      this.endpoint = endpoint
    }
    return this
  }
  
  plz() {
    if (this.domain === '') return Promise.reject(error('Sorry, but i can\'t fetch from nowhere'))
    if (this.endpoint === '') return Promise.reject(error('Sorry, but there isn\'t such endpoint'))
  
    // TODO When mapper will be workable - use this
    // if (!this.apis?.endpoints[this.endpoint]) return Promise.reject(error('Sorry, but there isn\'t such endpoint'))
    
    const url = `${this.domain}${this.endpoint}${this.query}`
    return this.fetch(url, this.options)
  }
  
  get(query?: Dictionary<string>) {
    this.query = query ? Object.keys(query).reduce((str, curr) => `${str}${curr}=${query[curr]}&`, '?') : ''
    this.options.method = Method.GET
    return this
  }
  
  private setBody(body: Dictionary<any>) {
    if (this.middlewares.body.length > 0) {
      this.options.body = pipe(this.middlewares.body)(body)
    } else {
      this.options.body = body
    }
  }
  
  post(body: Dictionary<any>) {
    this.options.method = Method.POST
    this.setBody(body)
    return this
  }
  
  put(body: Dictionary<any>) {
    this.options.method = Method.PUT
    this.setBody(body)
    return this
  }
  
  delete() {
    this.options.method = Method.DELETE
    return this
  }
  
  upload(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    this.options.method = Method.POST
    this.options.body = formData
    return this
  }
  
  with(options: Options) {
    if (options) this.options = merge(this.options, options)
    return this
  }
  
  addMiddleware(to: MiddlewareTarget, middleware: any | any[]) {
    this.middlewares[to] = middleware.length > 1 ? middleware : [middleware]
    return this
  }
  
}

function FetchmeFactory(api?: Api) {
  // TODO Under construction
  // TODO Need to be able pass string as well
  let persistApis: Dictionary<any> = {}
  // TODO validate api shape
  if (api) persistApis = { ...persistApis, [api.name]: api }
  return new Fetchme(persistApis)
}

export {
  Fetchme,
  FetchmeFactory
}

export default FetchmeFactory
