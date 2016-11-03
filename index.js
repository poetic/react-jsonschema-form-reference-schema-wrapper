'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = referenceSchemaWrapper;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _traverse = require('traverse');

var _traverse2 = _interopRequireDefault(_traverse);

require('react-selectize/themes/index.css');

var _reactSelectize = require('react-selectize');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// NOTE: use a custom ObjectSchemaField is a better solution
// NOTE: move this to uiSchema, maybe not, because this is not documented in uiSchema
function addReferenceSchema() {
  var uiSchema = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var referenceSchema = arguments[1];
  var findRefs = arguments[2];
  var stringifyReferenceData = arguments[3];

  var uiSchemaCopy = _lodash2.default.cloneDeep(uiSchema);

  (0, _traverse2.default)(referenceSchema).forEach(function (value) {
    if (value && typeof value['$ref'] === 'string') {
      _lodash2.default.set(uiSchemaCopy, this.path.join('.'), {
        'ui:widget': {
          component: 'reference',
          options: _extends({
            findRefs: findRefs,
            stringifyReferenceData: stringifyReferenceData
          }, value)
        }
      });
    }
  });

  return uiSchemaCopy;
}

var ReferenceWidget = function (_React$Component) {
  _inherits(ReferenceWidget, _React$Component);

  function ReferenceWidget(props) {
    _classCallCheck(this, ReferenceWidget);

    var _this = _possibleConstructorReturn(this, (ReferenceWidget.__proto__ || Object.getPrototypeOf(ReferenceWidget)).call(this, props));

    _this.state = {
      docs: [],
      selectedValue: null
    };
    _this.search = '';

    // get initial value for selectize
    if (props.value) {
      _this.handleSearchChange(props.value, function (docs) {
        var selectedValue = _lodash2.default.find(docs.map(function (doc) {
          return _this.docToOption(doc);
        }), { value: props.value });
        _this.setState({ selectedValue: selectedValue });
      });
    } else {
      _this.handleSearchChange();
    }
    return _this;
  }

  _createClass(ReferenceWidget, [{
    key: 'docToOption',
    value: function docToOption(doc) {
      var remoteKey = this.props.options.remoteKey;

      return {
        label: doc[remoteKey],
        value: doc[remoteKey]
      };
    }
  }, {
    key: 'handleSearchChange',
    value: function handleSearchChange(searchTerm, _callback) {
      var _this2 = this;

      var _props$options = this.props.options,
          findRefs = _props$options.findRefs,
          $ref = _props$options.$ref,
          remoteKey = _props$options.remoteKey;


      findRefs({
        $ref: $ref,
        searchTerm: searchTerm,
        remoteKey: remoteKey,
        callback: function callback(docs) {
          _this2.setState({ docs: docs });
          _callback && _callback(docs);
        }
      });
    }
  }, {
    key: 'handleValueChange',
    value: function handleValueChange(selectedValue) {
      this.setState({ selectedValue: selectedValue });

      // !REFERENCE_BSON!${metaValue} for referenceWrapper to consume
      var _props = this.props,
          onChange = _props.onChange,
          _props$options2 = _props.options,
          dependents = _props$options2.dependents,
          stringifyReferenceData = _props$options2.stringifyReferenceData;

      var value = _lodash2.default.get(selectedValue, 'value') || '';

      var selectedDoc = _lodash2.default.find(this.state.docs, _defineProperty({}, this.props.options.remoteKey, value)) || {};
      var metaValue = {
        value: value,
        dependents: dependents.map(function (_ref) {
          var key = _ref.key,
              remoteKey = _ref.remoteKey;
          return { key: key, value: selectedDoc[remoteKey] };
        })
      };

      onChange(stringifyReferenceData(metaValue));
    }
  }, {
    key: 'render',
    value: function render() {
      var _this3 = this;

      return _react2.default.createElement(_reactSelectize.SimpleSelect, {
        onSearchChange: function onSearchChange(search) {
          return _this3.handleSearchChange(search);
        },
        filterOptions: function filterOptions(options) {
          return options;
        },
        style: { width: '100%' },
        options: this.state.docs.map(function (doc) {
          return _this3.docToOption(doc);
        }),
        value: this.state.selectedValue,
        onValueChange: function onValueChange(selectedValue) {
          return _this3.handleValueChange(selectedValue);
        }
      });
    }
  }]);

  return ReferenceWidget;
}(_react2.default.Component);

var ReferenceSchemaForm = function (_React$Component2) {
  _inherits(ReferenceSchemaForm, _React$Component2);

  function ReferenceSchemaForm() {
    _classCallCheck(this, ReferenceSchemaForm);

    return _possibleConstructorReturn(this, (ReferenceSchemaForm.__proto__ || Object.getPrototypeOf(ReferenceSchemaForm)).apply(this, arguments));
  }

  _createClass(ReferenceSchemaForm, [{
    key: 'handleOnChange',
    value: function handleOnChange(event) {
      var changes = [];
      var parseReferenceData = this.props.parseReferenceData;


      var formData = (0, _traverse2.default)(_lodash2.default.cloneDeep(event.formData)).map(function (value) {
        var _this5 = this;

        if (typeof value === 'string') {
          var referenceObj = parseReferenceData(value);
          if (referenceObj) {
            var dependents = referenceObj.dependents,
                _value = referenceObj.value;

            dependents && dependents.forEach(function (_ref2) {
              var key = _ref2.key,
                  value = _ref2.value;

              changes.push({
                path: _this5.parent.path.concat(key).join('.'),
                value: value
              });
            });
            return _value;
          }
        }
      });

      changes.forEach(function (_ref3) {
        var path = _ref3.path,
            value = _ref3.value;

        _lodash2.default.set(formData, path, value);
      });

      this.props.onChange(Object.assign({}, event, { formData: formData }));
    }
  }, {
    key: 'render',
    value: function render() {
      var _this6 = this;

      var _props2 = this.props,
          uiSchema = _props2.uiSchema,
          referenceSchema = _props2.referenceSchema,
          stringifyReferenceData = _props2.stringifyReferenceData,
          findRefs = _props2.findRefs,
          Form = _props2.Form,
          widgets = _props2.widgets,
          onChange = _props2.onChange,
          other = _objectWithoutProperties(_props2, ['uiSchema', 'referenceSchema', 'stringifyReferenceData', 'findRefs', 'Form', 'widgets', 'onChange']);

      var extendedUiSchema = addReferenceSchema(uiSchema, referenceSchema, findRefs, stringifyReferenceData);

      return _react2.default.createElement(Form, _extends({
        widgets: _extends({ reference: ReferenceWidget }, widgets),
        uiSchema: extendedUiSchema,
        onChange: function onChange(event) {
          return _this6.handleOnChange(event);
        }
      }, other));
    }
  }]);

  return ReferenceSchemaForm;
}(_react2.default.Component);

var KEY_WORD = '!REFERENCE!';

function referenceSchemaWrapper(Form, _ref4) {
  var findRefs = _ref4.findRefs,
      _ref4$parse = _ref4.parse,
      parse = _ref4$parse === undefined ? JSON.parse : _ref4$parse,
      _ref4$stringify = _ref4.stringify,
      stringify = _ref4$stringify === undefined ? JSON.stringify : _ref4$stringify;

  var parseReferenceData = function parseReferenceData(string) {
    if (string.indexOf(KEY_WORD) === 0) {
      return parse(string.replace(KEY_WORD, ''));
    }
  };

  var stringifyReferenceData = function stringifyReferenceData(object) {
    return '' + KEY_WORD + stringify(object);
  };

  return function (props) {
    return _react2.default.createElement(ReferenceSchemaForm, _extends({
      Form: Form,
      parseReferenceData: parseReferenceData,
      stringifyReferenceData: stringifyReferenceData,
      findRefs: findRefs
    }, props));
  };
}
