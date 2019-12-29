export type Dictionary<T> = { [key: string]: T }

export type Partial<T> = { [P in keyof T]?: T[P] }

export const pipe = (...fns: any[]) => (value: any) => fns.reduce((prevValue, currentFn) => currentFn(prevValue), value)

export enum Method {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE'
}

export interface Options {
  method: Method,
  body?: any,
  headers?: object
}

export interface SuccessResult {
  success: true
  data: any
}

export type Success = (s: any) => SuccessResult

export function isSuccessResult(input: any): input is SuccessResult {
  return input.success === true && input.data
}

export const success: Success = s => {
  if (isSuccessResult(s)) return s as SuccessResult
  return {
    success: true,
    data: s
  } as SuccessResult
}

export interface ErrorResult {
  success: false
  data: any
}

export type Error = (e: any) => ErrorResult

export function isErrorResult(input: any): input is ErrorResult {
  return input.success === false && input.data
}

export const error: Error = e => {
  if (isErrorResult(e)) return e as ErrorResult
  return {
    success: false,
    data: e
  } as ErrorResult
}

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

// TODO Under construction
export type ValidateShape<T, Shape> = T extends Shape
  ? Exclude<keyof T, keyof Shape> extends never
    ? T
    : never
  : never

// function isType<>

// declare function setApis<T>(apis: ValidateShape<T, Api>): void

// TODO Under construction
// function isType<T>(input: any): input is T {
//
// }

// FIXME Fast but ugly
export function isApi(input: any): input is Api {
  return (input.name && input.domain && input.endpoints)
}

export function isApiDict(input: any): input is Dictionary<Api> {
  if (typeof input !== 'object' || Array.isArray(input)) return false
  
  // TODO Under construction
  if (typeof input === 'object') return !<boolean>Object.values(input).find((item: any) => !isApi(item))
  
  return false
}

export function isFullUrl(input: unknown): input is string {
  return typeof input === 'string' && /^http/.test(input)
}

export const convert = (converter: Function) => (input: any): any => {
  if (Array.isArray(input)) return input.map(item => convert(converter)(item))
  if (typeof input === 'object') return Object.entries(input)
    .reduce((obj, [key, value]) => ({...obj, [converter(key)]: convert(converter)(value)}), {})
  return input
}
