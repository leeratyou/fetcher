export type Dictionary<T> = { [key: string]: T }

export type Partial<T> = { [P in keyof T]?: T[P] }

// TODO Under construction
export type ValidateShape<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export interface Options {
  method?: Method,
  body?: any,
  headers: Dictionary<string>
}

export interface SuccessResult {
  success: true
  data: any
}

export type Success = (s: any) => SuccessResult

export interface ErrorResult {
  success: false
  data: any
}

export type Error = (e: any) => ErrorResult

export type StringFactory = (...args: any[]) => string

export interface EndpointsDictionary extends Dictionary<any>{
  [key: string]: StringFactory | EndpointsDictionary
}

export interface Api extends Dictionary<any> {
  name: string
  domain: string
  endpoints: EndpointsDictionary
}

export enum MiddlewareTarget {
  response = 'response',
  body = 'body',
  resolve = 'resolve',
  reject = 'reject'
}

export type Middleware = { [target in MiddlewareTarget]: any[] }

export interface FetchObject {
  that: any
  url: string
  options: Options
}
