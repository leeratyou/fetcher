# @supersimplethings/fetchme
![npm (scoped)](https://img.shields.io/npm/v/@supersimplethings/fetchme)

> Things should be simple to use

Polite fetch library.

## Usage

```javascript
import fetchme from '@supersimplethings/fetchme'

async function getResponse(someArgs) {
  const body = {
    some: someArgs.some,
    args: someArgs.args
  }
  const response = await fetchme().post(body).
}
```

## Installation

With [npm](https://npmjs.org/):

```shell
npm install @supersimplethings/resize-image-in-browser
```

With [yarn](https://yarnpkg.com/en/):

```shell
yarn add @supersimplethings/resize-image-in-browser
```

## API

```typescript
type Resize = (file: File, options?: Options) => Promise<dataURL|Blob|File>

interface Options {
  maxWidth?: number   (1024) // in pixels // Aspect ratio will be saved
  maxHeight?: number  (768) // in pixels  // Smaller one dimension would be applied
  output?: Output     (jpeg)
  format?: Format     (dataURL)
  quality?: number    (1.0) // from 0.1 to 1.0 (only 'jpeg')
}

enum Format {
  png = 'png',
  jpeg = 'jpeg',
  webp = 'webp',
  bmp = 'bmp'
}

enum Output {
  dataURL = 'dataURL',
  File = 'File',
  Blob = 'Blob'
}
```

## License

MIT
