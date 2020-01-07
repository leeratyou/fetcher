import merge from 'deepmerge'
import { HAS_SYMBOL, NO_DOMAIN, NO_ENDPOINT, SHOULD_DEFINE_API } from './strings'
import {
  Api,
  Dictionary,
  EndpointsDictionary,
  error,
  isApi, isFetchme,
  isFullUrl,
  Method,
  Middleware,
  MiddlewareTarget,
  Options,
  pipe,
  StringFactory,
  success
} from "./utils";
import { statusNotOk, stringify, takeJson, keyConvert, toFormData, takeBlob } from "./middleware";

interface Fetchme {
  new(apis?: Api | Dictionary<Api>): Fetchme
}

class Fetchme implements Fetchme {
  
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
  
  debug = false
  setDebug(to: boolean) {
    this.debug = to
    return this
  }
  
  apis?: Dictionary<Api> = {}
  
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
    this._body = pipe(...this.middleware.body)(newValue)
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
    return new Promise(resolve => {
      fetch(url, options)
        .then((response: Response) => {
          return pipe(...this.middleware.response)(response)
        })
        .then((json: unknown) => {
          resolve(pipe(...this.middleware.resolve)(json))
        })
        .catch((e: any) => {
          resolve(pipe(...this.middleware.reject)(e))
        })
        .finally(() => {
          if (this._tempOptions) {
            this.options = { ...this._tempOptions }
            this._tempOptions = undefined
          }
        })
    })
  }
  
  private endpointsFactory = (endpoints?: EndpointsDictionary): Fetchme | EndpointsDictionary => {
    if (!endpoints) throw error(NO_ENDPOINT)
    const that = this
    
    return new Proxy(endpoints, {
      get(target, prop) {
        if (typeof prop === 'symbol') throw error(HAS_SYMBOL)
        if (!target[prop]) throw error(NO_ENDPOINT)
        
        if (typeof target[prop] === 'function') {
          that.endpoint = target[prop] as StringFactory
          return that
        }
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
  
  post(body: Dictionary<any>) {
    this.options.method = Method.POST
    this.body = body
    return this
  }
  
  put(body: Dictionary<any>) {
    this.options.method = Method.PUT
    this.body = body
    return this
  }
  
  delete() {
    this.options.method = Method.DELETE
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
  
  useApi(to: string) {
    this.mapper(to)
    return this
  }
  
  // FIXME Shouldnt be push here
  addMiddleware(to: MiddlewareTarget, ...middleware: any[]) {
    // TODO Enum type guard of 'to'
    this.middleware[to].push(...middleware)
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

class Repository {
  
  constructor(apis: Dictionary<Api>, fetcher: Fetchme | any) {
    this.apis = apis
    this.fetcher = isFetchme(fetcher) ? new Fetchme(apis) : fetcher
  }
  
  private apis: Dictionary<Api>
  
  private fetcher: Fetchme
}

export {
  Fetchme,
  Repository,
  keyConvert
}

export default Fetchme
