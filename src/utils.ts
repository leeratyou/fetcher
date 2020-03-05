import Fetcher from './fetcher'
import { Api, Dictionary, ErrorResult, Success, SuccessResult, Error } from "./types";

export const pipe = (instance: Fetcher) => (...fns: any[]) => (value: any) => fns.reduce((prevValue, currentFn) => currentFn(prevValue, instance), value)

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

export function isFetcher(input: any): input is Fetcher {
  return input instanceof Fetcher
}
