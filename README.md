# react-jsonschema-form-reference-schema-wrapper

[![travis][travis-image]][travis-url]
[![npm][npm-image]][npm-url]
[![semantic-release][semantic-release-image]][semantic-release-url]

[travis-image]:            https://img.shields.io/travis/poetic/react-jsonschema-form-reference-schema-wrapper.svg?branch=master
[travis-url]:              https://travis-ci.org/poetic/react-jsonschema-form-reference-schema-wrapper
[npm-image]:               https://img.shields.io/npm/v/react-jsonschema-form-reference-schema-wrapper.svg
[npm-url]:                 https://npmjs.org/package/react-jsonschema-form-reference-schema-wrapper
[semantic-release-image]:  https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]:    https://github.com/semantic-release/semantic-release

## Usage
- Wrap JSON schema form with this function:
  ```
  import Form from 'react-jsonschema-form';
  const WrappedForm = referenceSchemaWrapper(
    Form,
    {
      findRefs,
      parse: EJSON.parse,
      stringify: EJSON.stringify,
    }
  )
  ```

- specify options in referenceSchema which should be passed into the form as
  a prop along with your schema
  ```
  domainId: {
    $ref: 'domains',
    remoteKey: '_id',
    remoteLabelKey: 'name'
    dependents: [
      { key: 'domainName', remoteKey: 'name' },
    ],
    filters: [
      { key: 'active', value: 'true' },
      // The following is not implemented yet, we may need a serious refactor
      // to make all those thing work, consider using context in the
      // jsonschemaform
      { key: 'businessGroupId', valueAbsoluteKey: 'businessGroupId' },
    ]
  }
  ```

## Development
Build index.js file before using on local
```
npm run build
```
