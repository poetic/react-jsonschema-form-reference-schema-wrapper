import _ from 'lodash'
import React from 'react'
import traverse from'traverse'
import 'react-selectize/themes/index.css'
import { SimpleSelect } from 'react-selectize'
import BaseInput from 'react-bsonschema-form/lib/components/widgets/BaseInput';

// NOTE: use a custom ObjectSchemaField is a better solution
// NOTE: move this to uiSchema, maybe not, because this is not documented in uiSchema
function addReferenceSchema(uiSchema={}, referenceSchema, findRefs, stringifyReferenceData) {
  const uiSchemaCopy = _.cloneDeep(uiSchema)

  traverse(referenceSchema).forEach(function(value) {
    if (value && typeof value['$ref'] === 'string') {
      _.set(
        uiSchemaCopy,
        this.path,
        Object.assign(
          {
            'ui:widget': 'reference',
            'ui:options': {
              findRefs,
              stringifyReferenceData,
              ...value
            }
          },
          _.get(uiSchemaCopy, this.path)
        )
      )
    }
  })

  return uiSchemaCopy
}

class ReferenceWidget extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      docs: [],
      selectedValue: null,
    }
  }

  componentWillMount() {
    this.updateStateFromProp(this.props)
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.updateStateFromProp(nextProps)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const oldSubsData = prevProps.formContext.subscriptionsData;
    const newSubsData = this.props.formContext.subscriptionsData;
    if (oldSubsData !== newSubsData) {
      this.updateStateFromProp(this.props);
    }
  }

  updateStateFromProp(props) {
    // get value from props for selectize
    if (props.value) {
      this.handleSearchChange({
        searchKey: props.options.remoteKey,
        searchTerm: props.value,
        callback: (docs) => {
          const selectedValue = _.find(
            docs.map((doc) => this.docToOption(doc)),
            {value: props.value}
          )
          this.setState({ selectedValue })
        }
      })
    } else {
      this.handleSearchChange({})
      this.setState({ selectedValue: null })
    }
  }

  docToOption(doc) {
    const { options: { remoteKey, remoteLabelKey } } = this.props
    return {
      label: doc[remoteLabelKey || remoteKey],
      value: doc[remoteKey],
    }
  }

  reduceFilters(filters) {
    return (filters || []).reduce((acc, filter) => {
      const { key } = filter
      const { formData } = this.props
      if (typeof filter.value !== 'undefined') {
        acc[key] = filter.value
      }      return acc
    }, {})
  }

  getFiltersFromSubscriptions() {
    const stepId = _.get(this.props.formContext, 'currentStep');
    const curFormPath = this
      .props
      .id
      .replace(/^root_/, '')
      .replace(/_/g, '.');
    const curWorkflowPath = `${stepId}.${curFormPath}`

    const filters = _.get(this.props, 'formContext.subscriptionsData', [])
      .filter(({ absolutePath, type }) => {
        return type === 'FILTER' && absolutePath === curWorkflowPath
      })
      .reduce((filters, {value, doc, filterByPubField, filterByOwnField}) => {
        const filterValue = filterByPubField
          ? _.get(doc, filterByPubField)
          : value;
        return Object.assign({ [filterByOwnField]: filterValue }, filters)
      }, {})
    return filters;
  }

  handleSearchChange({searchTerm, searchKey, callback}) {
    const {
      findRefs,
      $ref,
      remoteLabelKey,
      remoteKey,
      filters
    } = this.props.options

    findRefs(
      {
        $ref,
        searchTerm,
        filters: Object.assign({}, this.reduceFilters(filters), this.getFiltersFromSubscriptions()),
        remoteKey: searchKey || remoteLabelKey || remoteKey,
        callback: (docs) => {
          this.setState({ docs })
          callback && callback(docs)
        }
      }
    )
  }

  handleValueChange(selectedValue) {
    this.setState({selectedValue})

    // !REFERENCE_BSON!${metaValue} for referenceWrapper to consume
    const { onChange, options: { dependents, stringifyReferenceData } } = this.props
    const value = _.get(selectedValue, 'value') || ''

    const selectedDoc = _.find(this.state.docs, { [this.props.options.remoteKey]: value }) || {}
    const metaValue = {
      value,
      dependents: (dependents || []).map(
        ({ key, remoteKey }) => ({ key, value: selectedDoc[remoteKey] })
      )
    }

    onChange(stringifyReferenceData(metaValue))
  }

  render() {
    if (this.props.readonly || this.props.disabled) {
      return <BaseInput
        {..._.pick(this.props, ['id', 'disabled', 'readonly'])}
        value={_.get(this.state.selectedValue, 'label')}
      />
    }
    return <SimpleSelect
      onSearchChange={(searchTerm) => this.handleSearchChange({searchTerm})}
      filterOptions={(options) => options}
      style={{ width: '100%' }}
      options={this.state.docs.map((doc) => this.docToOption(doc))}
      value={this.state.selectedValue}
      onValueChange={(selectedValue) => this.handleValueChange(selectedValue)}
    />
  }
}

class ReferenceSchemaForm extends React.Component {
  handleOnChange(event) {
    const changes = []
    const { parseReferenceData } = this.props

    const formData = traverse(_.cloneDeep(event.formData)).map(function(value) {
      if (typeof value === 'string') {
        const referenceObj = parseReferenceData(value)
        if (referenceObj) {
          const { dependents, value } = referenceObj
          dependents && dependents.forEach(({ key, value }) => {
            changes.push({
              path: this.parent.path.concat(key),
              value
            })
          })
          return value
        }
      }
    })

    changes.forEach(({ path, value }) => {
      _.set(formData, path, value)
    })

    this.props.onChange(Object.assign({}, event, {formData}))
  }

  render() {
    const {
      uiSchema,
      referenceSchema,
      stringifyReferenceData,
      findRefs,
      Form,
      widgets,
      onChange,
      ...other
    } = this.props

    const extendedUiSchema = addReferenceSchema(
      uiSchema,
      referenceSchema,
      findRefs,
      stringifyReferenceData
    )

    return <Form
      widgets={{ reference: ReferenceWidget, ...widgets }}
      uiSchema={extendedUiSchema}
      onChange={(event) => this.handleOnChange(event)}
      {...other}
    />
  }
}

const KEY_WORD = '!REFERENCE!'

export default function referenceSchemaWrapper (Form, {findRefs, parse=JSON.parse, stringify=JSON.stringify}) {
  const parseReferenceData = (string) => {
    if (string.indexOf(KEY_WORD) === 0) {
      return parse(string.replace(KEY_WORD, ''))
    }
  }

  const stringifyReferenceData = (object) => {
    return `${KEY_WORD}${stringify(object)}`
  }

  return (props) => (
    <ReferenceSchemaForm
      Form={Form}
      parseReferenceData={parseReferenceData}
      stringifyReferenceData={stringifyReferenceData}
      findRefs={findRefs}
      {...props}/>
  )
}
