import merge from 'deepmerge'
import { HAS_SYMBOL, NO_DOMAIN, NO_ENDPOINT, SHOULD_DEFINE_API, NOTHING } from './strings'
import { error, isApi, isFullUrl, pipe, success } from './utils'
import { statusNotOk, stringify, takeJson, toFormData } from './middleware'
import { Api, Dictionary, EndpointsDictionary, Method, Middleware, MiddlewareTarget, Options, StringFactory, FetchObject, Provider } from './types'

interface Fetcher {
  new(apis?: Api | Dictionary<Api>): Fetcher
}

class Fetcher implements Fetcher {
  
  constructor(apis?: Api | Dictionary<Api>) {
    // TODO Under construction
    // TODO Need to be able pass string as well
    if (apis) this.setApis(apis)
    // if (!fetch) this.provider = require('node-fetch').default
  }
  
  private setApis(apis: Api | Dictionary<Api>) {
    // TODO Under construction
    if (isApi(apis)) {
      this.apis = {...this.apis, [apis.name]: apis}
    } else {
      this.apis = apis
    }
  }
  
  debug = false
  setDebug(to: boolean) {
    this.debug = to
    return this
  }
  
  queue: FetchObject[] = []
  apis?: Dictionary<Api> = {}
  
  // provider: Provider = window?.fetch.bind(this)
  _tempOptions: any = undefined
  options: Options = {
    method: Method.GET,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8'
    }
  }
  
  // Make body resetable after calling
  // TODO Check proper body resetability (should write test?) and if dont work - need 'reset' method
  private _body: Dictionary<any> | FormData | undefined = undefined
  
  get body() {
    if (this.debug) console.log('--- index.ts -> get body -> this._body', this._body)
    if (!this._body) return {}
    const temp = this._body
    this._body = undefined
    return { body: temp }
  }
  
  set body(newValue) {
    if (this.debug) console.log('--- index.ts -> set body -> newValue', newValue)
    this._body = pipe(this)(...this.middleware.body)(newValue)
    if (this.debug) console.log('--- index.ts -> set body -> after pipe', this._body)
  }
  
  // TODO Need way to define pipe or compose
  middleware: Middleware = {
    body: [stringify],
    response: [statusNotOk, takeJson],
    resolve: [success],
    reject: [error],
  }
  
  currentApi: string | undefined = undefined
  domain: string | undefined = undefined
  endpoint: string | StringFactory | undefined = undefined
  query: string = ''
  arguments: Array<string | number> = []
  
  private fetch(url: string, options: any) {
    this.queue.push({ url, options, that: this })
    if (this.debug) console.log('--- index.ts -> fetch -> queue is after push (*be careful coz it\'s seems mutable obj): ', this.queue)
    
    return new Promise(resolve => {
      fetch(url, options)
        .then((response: Response) => {
          if (this.debug) console.log('--- index.ts -> fetch -> response', response)
          return pipe(this)(...this.middleware.response)(response)
        })
        .then((json: unknown) => {
          if (this.debug) console.log('--- index.ts -> fetch -> resolve', json)
          resolve(pipe(this)(...this.middleware.resolve)(json))
        })
        .catch((e: any) => {
          if (this.debug) console.log('--- index.ts -> fetch -> catch', e)
          resolve(pipe(this)(...this.middleware.reject)(e))
        })
        .finally(() => {
          this.queue.pop()
          if (this.debug) console.log('--- index.ts -> fetch -> queue is: ', this.queue)
          if (this._tempOptions) {
            if (this.debug) console.log('--- index.ts -> fetch -> _tempOptions', this._tempOptions)
            if (this.debug) console.log('--- index.ts -> fetch -> options', this.options)
            this.options = { ...this._tempOptions }
            this._tempOptions = undefined
          }
        })
    })
  }
  
  private endpointsFactory = (endpoints?: EndpointsDictionary): Fetcher | EndpointsDictionary => {
    if (this.debug) console.log('--- index.ts -> endpointsFactory -> endpoints', endpoints)
    if (!endpoints) throw error(`${NO_ENDPOINT} with: ${NOTHING}`)
    const that = this
    
    return new Proxy(endpoints, {
      get(target, prop) {
        if (that.debug) console.log('--- index.ts -> endpointsFactory -> get', target, prop)
        if (typeof prop === 'symbol') throw error(HAS_SYMBOL)
        if (!target[prop]) throw error(`${NO_ENDPOINT} with: ${prop}`)
        
        if (typeof target[prop] === 'function') {
          if (that.debug) console.log('--- index.ts -> endpointsFactory -> get StringFactory', target, prop)
          that.endpoint = target[prop] as StringFactory
          return that
        }
        if (that.debug) console.log('--- index.ts -> endpointsFactory -> get Dive deeper', target, prop)
        if (typeof target[prop] === 'object') return that.endpointsFactory(target[prop] as EndpointsDictionary)
      }
    })
  }
  
  private parser(url: string) {
    const parsed = new URL(url)
    this.domain = parsed.origin
    this.endpoint = parsed.pathname
  }
  
  private mapper = (api: string | undefined): any => {
    if (isFullUrl(api)) {
      this.parser(api)
      return this
    }
    if (!api && !this.currentApi) throw error(SHOULD_DEFINE_API)
    const apiToUse = this.currentApi || api
    this.currentApi = apiToUse
    this.domain = this.apis?.[apiToUse!].domain
    const endpoints = this.apis?.[apiToUse!].endpoints
    
    return this.endpointsFactory(endpoints)
  }
  
  /* PUBLIC METHODS */
  
  from(api?: any) {
    return this.mapper(api)
  }
  
  to(api?: any) {
    return this.mapper(api)
  }
  
  get(query?: Dictionary<any>) {
    this.query = query ? Object.keys(query).reduce((str, curr) => `${str}${curr}=${query[curr]}&`, '?') : ''
    this.options.method = Method.GET
    return this
  }
  
  post(body?: Dictionary<any>) {
    this.options.method = Method.POST
    if (body) this.body = body
    return this
  }
  
  put(body?: Dictionary<any>) {
    this.options.method = Method.PUT
    if (body) this.body = body
    return this
  }
  
  delete(body?: Dictionary<any>) {
    this.options.method = Method.DELETE
    if (body) this.body = body
    return this
  }
  
  upload(input: File | Dictionary<any>) {
    this._tempOptions = { ...this.options }
    this.options.headers = {}
    this.options.method = Method.POST
    this.middleware.body = [toFormData]
    // @ts-ignore
    this.body = input
    return this
  }
  
  with(...args: Array<string | number>) {
    this.arguments = args
    return this
  }
  
  setOptions(options: Options) {
    this.options = merge(this.options, options)
    return this
  }
  
  useProvider(provider: Provider) {
    this.provider = provider
    return this
  }
  
  useApi(to: string) {
    this.mapper(to)
    return this
  }
  
  useMiddleware(on: MiddlewareTarget, middleware: Middleware[]) {
    this.middleware[on] = middleware
    return this
  }
  
  plz() {
    if (!this.domain) return Promise.reject(error(NO_DOMAIN))
    if (!this.endpoint) return Promise.reject(error(NO_ENDPOINT))
    
    const options = {
      ...this.options,
      ...this.body
    }
    if (this.debug) console.log('--- index.ts -> plz -> options', options)
    const endpoint = typeof this.endpoint === 'function' ? this.endpoint(...this.arguments) : this.endpoint
    const query = this.query.replace(/&$/, '')
    const url = `${this.domain}${endpoint}${query}`.replace(/([^:]\/)\/+/g, '$1')
    
    return this.fetch(url, options)
  }
  
}

export default Fetcher
