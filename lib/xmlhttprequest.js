// The MIT License (MIT)
//
// Copyright (c) 2011-2013 Yamagishi Kazutoshi
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.
(function(global) {
  'use strict';

  var Request = require('./request');
  var Event = require('./event');
  var ProgressEvent = require('./progressevent');
  var XMLHttpRequestEventTarget = require('./xmlhttprequesteventtarget');
  var XMLHttpRequestUpload = require('./xmlhttprequestupload');

  function XMLHttpRequest(options) {
    if (!(this instanceof XMLHttpRequest)) {
      throw new TypeError('DOM object constructor cannot be called as a function.');
    }
    XMLHttpRequestEventTarget.call(this);
    options = options || {};
    this._flag.anonymous = !!options.anon;
    Object.defineProperty(this, 'upload', {
      configurable: true,
      enumerable: true,
      value: new XMLHttpRequestUpload(),
      writable: false
    });
  }

  XMLHttpRequest.prototype = Object.create(XMLHttpRequestEventTarget.prototype);

  var XMLHttpRequestResponseType = [
    '',
    'arraybuffer',
    'blob',
    'document',
    'json',
    'text'
  ];

  (function(proto) {
    (function() {
      var constants = {
        UNSENT: {
          configurable: false,
          enumerable: true,
          value: 0,
          writable: false
        },
        OPENED: {
          configurable: false,
          enumerable: true,
          value: 1,
          writable: false
        },
        HEADERS_RECEIVED: {
          configurable: false,
          enumerable: true,
          value: 2,
          writable: false
        },
        LOADING: {
          configurable: false,
          enumerable: true,
          value: 3,
          writable: false
        },
        DONE: {
          configurable: false,
          enumerable: true,
          value: 4,
          writable: false
        }
      };

      Object.defineProperties(XMLHttpRequest, constants);
      Object.defineProperties(proto, constants);
    })();

    Object.defineProperties(proto, {
      _flag: {
        configurable: false,
        enumerable: false,
        get: function getter() {
          var flag = Object.create(Object.prototype, {
            anonymous: {
              configurable: false,
              enumerable: true,
              value: false,
              writable: true
            },
            synchronous: {
              configurable: false,
              enumerable: true,
              value: false,
              writable: true
            },
            uploadComplete: {
              configurable: false,
              enumerable: true,
              value: false,
              writable: true
            },
            uploadEvents: {
              configurable: false,
              enumerable: true,
              value: false,
              writable: true
            }
          });
          Object.defineProperty(this, '_flag', {
            configurable: false,
            enumerable: false,
            value: flag,
            writable: false
          });
          return flag;
        }
      },
      _request: {
        configurable: true,
        enumerable: false,
        get: function getter() {
          var request = new Request();
          Object.defineProperty(this, '_request', {
            configurable: false,
            enumerable: false,
            value: request,
            writable: false
          });
          return request;
        }
      },
      readyState: {
        configurable: true,
        enumerable: true,
        value: XMLHttpRequest.UNSENT,
        writable: false
      },
      responseType: {
        configurable: false,
        enumerable: true,
        get: function getter() {
          var request = this._request;
          var responseType = request.responseType;
          if (XMLHttpRequestResponseType.indexOf(responseType) < 0) {
            return '';
          }
          return responseType;
        },
        set: function setter(responseType) {
          var request = this._request;
          if (XMLHttpRequestResponseType.indexOf(responseType) < 0) {
            throw new Error(''); // todo
          }
          return request.responseType = responseType;
        }
      },
      response: {
        configurable: false,
        enumerable: true,
        get: function getter() {
          var request = this._request;
          return request.response;
        }
      },
      responseText: {
        configurable: false,
        enumerable: true,
        get: function getter() {
          var request = this._request;
          return request.responseText;
        }
      },
      responseXML: {
        configurable: false,
        enumerable: true,
        value: null, // todo
        writable: false
      },
      status: {
        configurable: true,
        enumerable: true,
        get: function getter() {
          var request = this._request;
          return request.status;
        }
      },
      statusText: {
        configurable: true,
        enumerable: true,
        get: function getter() {
          var request = this._request;
          return request.statusText;
        }
      },
      timeout: {
        configurable: true,
        enumerable: true,
        value: 0,
        writable: false
      },
      upload: {
        configurable: true,
        enumerable: true,
        value: null,
        writable: false
      },
      withCredentials: {
        configurable: true,
        enumerable: true,
        value: false,
        writable: false
      }
    });

    function _readyStateChange(readyState) {
      var readyStateChangeEvent = new Event('');
      readyStateChangeEvent.initEvent('readystatechange', false, false);
      Object.defineProperty(this, 'readyState', {
        configurable: true,
        enumerable: true,
        value: readyState,
        writable: false
      });
      this.dispatchEvent(readyStateChangeEvent);
    }

    function _receiveResponse(event) {
      var request = this._request;
      var response = request._response;
      var contentLength = '0';
      var bufferLength = 0;
      var byteOffset = 0;
      request.responseHeaders = response.headers;
      contentLength = response.headers['content-length'] || contentLength;
      bufferLength = parseInt(contentLength, 10);
      request.responseBuffer = new Buffer(bufferLength);
      _readyStateChange.call(this, XMLHttpRequest.LOADING);
      response.addListener('data', function(chunk) {
        var buffer;
        if (bufferLength === 0) {
          buffer = request.responseBuffer;
          request.responseBuffer = new Buffer(buffer.length + chunk.length);
          buffer.copy(request.responseBuffer);
        }
        chunk.copy(request.responseBuffer, byteOffset);
        byteOffset += chunk.length;
      });
      response.addListener('end', function() {
        _readyStateChange.call(this, XMLHttpRequest.DONE);
        //request.initialize();
      }.bind(this));
    }

    function _setDispatchProgressEvents(stream) {return;
      var loadStartEvent = new ProgressEvent('loadstart');
      this.dispatchEvent(loadStartEvent);
      stream.on('data', function() {
        var progressEvent = new ProgressEvent('progress');
        this.dispatchEvent(progressEvent);
      }.bind(this));
      stream.on('end', function() {
        var loadEvent = new ProgressEvent('load');
        var loadEndEvent = new ProgressEvent('loadend')
        this.dispatchEvent(loadEvent);
        this.dispatchEvent(loadEndEvent);
      }.bind(this));
    }

    proto.abort = function abort() {
      var request = this._request;
      request.abort();
      this.dispatchEvent(new ProgressEvent('abort'));
      this.upload.dispatchEvent(new ProgressEvent('abort'));
    };

    proto.getAllResponseHeaders = function getAllResponseHeaders() {
      var readyState = this.readyState;
      var request = this._request;
      if ([XMLHttpRequest.UNSENT, XMLHttpRequest.OPENED].indexOf(readyState) >= 0) {
        throw new Error(''); // todo
      }
      return Object.keys(request.responseHeaders).map(function(key) {
        return [key, request.responseHeaders[key]].join(': ');
      }).join('\n');
    };

    proto.getResponseHeader = function getResponseHeader(header) {
      var readyState = this.readyState;
      var key;
      var value;
      if ([XMLHttpRequest.UNSENT, XMLHttpRequest.OPENED].indexOf(readyState) >= 0) {
        throw new Error(''); // todo;
      }
      key = header.toLowerCase();
      value = this._request.responseHeaders[key];
      return typeof value !== 'undefined' ? '' + value : null;
    };

    proto.open = function open(method, uri, async, user, password) {
      var argumentCount = arguments.length;
      var request = this._request;
      if (argumentCount < 2) {
        throw new TypeError('Not enought arguments');
      }
      this._flag.synchronous = !!async;
      request.open.apply(request, arguments);
      _readyStateChange.call(this, XMLHttpRequest.OPENED);
    };

    proto.overrideMimeType = function overrideMimeType(mime) {
      // todo
    };

    proto.send = function send(body) {
      var request = this._request;
      var async = this._flag.synchronous;
      if (this.readyState !== XMLHttpRequest.OPENED) {
        throw new Error(); // todo
      }
      request.addEventListener('response', function(event) {
        _setDispatchProgressEvents.apply(this, arguments);
        _receiveResponse.apply(this, arguments);
      }.bind(this), false);
      _readyStateChange.call(this, XMLHttpRequest.HEADERS_RECEIVED);
      return request.send.apply(request, arguments);
    };

    proto.setRequestHeader = function setRequestHeader(header, value) {
      var request = this._request;
      if (this.readyState === XMLHttpRequest.UNSENT) {
        throw new Error(''); // todo  
      }
      request.requestHeaders[header] = value;
    };
  })(XMLHttpRequest.prototype);

  module.exports = XMLHttpRequest;
})(this);
