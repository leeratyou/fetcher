import { NOT_VALID_JSON, NO_RESPONSE } from "./strings";
import { error } from "./utils";

export function statusNotOk(response: Response) {
  if (!response.ok) throw error({status: response.status, statusText: response.statusText})
  return response
}

export function stringify(input: object) {
  const s = JSON.stringify(input)
  try {
    if (JSON.parse(s)) return s
  } catch {
    throw error(NOT_VALID_JSON)
  }
}

export function takeJson(input: unknown) {
  if (input instanceof Response) return input.json()
  throw error(NO_RESPONSE)
}

export const keyConvert = (converter: Function) => (input: any): any => {
  if (Array.isArray(input)) return input.map(item => keyConvert(converter)(item))
  if (typeof input === 'object') return Object.entries(input).reduce((obj, [key, value]) => ({ ...obj, [converter(key)]: keyConvert(converter)(value) }), {})
  return input
}
