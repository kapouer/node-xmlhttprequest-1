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

  var http = require('http');
  var https = require('https');
  var uriParse = require('url').parse;

  var Event = require('./event');
  var EventTarget = require('./eventtarget');

  function Request() {
    EventTarget.call(this);
    this.addEventListener('response', this, false);
  }

  Request.prototype = Object.create(EventTarget.prototype);

  (function(proto) {
    Object.defineProperties(proto, {
      _response: {
        configurable: false,
        enumerable: false,
        get: function getter() {
          var client = this.client;
          return client.response;
        }
      },
      async: {
        configurable: false,
        enumerable: true,
        value: false,
        writable: true
      },
      client: {
        configurable: true,
        enumerable: true,
        get: function getter() {
          var options = this.options;
          var client = new ClientRequest(options, this);
          Object.defineProperty(this, 'client', {
            configurable: false,
            enumerable: false,
            value: client,
            writable: false
          });
          return client;
        }
      },
      host: {
        configurable: true,
        enumerable: true,
        value: 'localhost',
        writable: false,
      },
      method: {
        configurable: true,
        enumerable: true,
        value: 'GET',
        writable: false
      },
      options: {
        configurable: true,
        enumerable: true,
        get: function getter() {
          var client = this;
          var object = Object.create(Object.prototype, {
            agent: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                if (client.scheme === 'https') {
                  return https.globalAgent;
                }
                return http.globalAgent;
              }
            },
            auth: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                var user = client.user;
                var password = client.password;
                if (!user) {
                  return '';
                }
                return [user, password].join(':');
              }
            },
            host: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                var host = client.host;
                return host || 'localhost';
              }
            },
            method: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                return client.method || 'GET';
              }
            },
            path: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                var path = client.path;
                return path || '/';
              }
            },
            port: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                var port = client.port;
                return port || 80;
              }
            },
            protocol: {
              configurable: false,
              enumerable: true,
              get: function getter() {
                var scheme = client.scheme;
                return (scheme || 'http') + ':';
              }
            }
          });
          Object.defineProperty(this, 'options', {
            configurable: false,
            enumerable: true,
            value: object,
            writable: false
          });
          return object;
        }
      },
      password: {
        configurable: false,
        enumerable: true,
        value: '',
        writable: true
      },
      path: {
        configurable: true,
        enumerable: true,
        value: '/',
        writable: false
      },
      port: {
        configurable: true,
        enumerable: true,
        value: 80,
        writable: false,
      },
      uri: {
        configurable: false,
        enumerable: true,
        get: function getter() {
          var uri = '';
          var scheme = this.scheme || 'http';
          var user = this.user || '';
          var password = this.password || '';
          var host = this.host || 'localhost';
          var path = this.path || '/';
          uri += scheme + '://';
          if (user) {
            uri += [user, password].join(':') + '@';
          }
          uri += host;
          uri += path;
          return uri;
        },
        set: function setter(value) {
          var parsedUriObject = uriParse(value);
          var auth = (parsedUriObject.auth || '').split(':', 2);
          var scheme = (parsedUriObject.protocol || '').split(':', 2)[0] || 'http';
          var host = parsedUriObject.hostname || 'localhost';
          var path = parsedUriObject.path || '/';
          var user = auth.shift() || '';
          var password = auth.shift() || '';
          Object.defineProperties(this, {
            host: {
              configurable: true,
              enumerable: true,
              value: host,
              writable: false
            },
            path: {
              configurable: true,
              enumerable: true,
              value: path,
              writable: false
            },
            scheme: {
              configurable: true,
              enumerable: true,
              value: scheme,
              writable: false
            }
          });
          this.user = user;
          this.password = password;
        }
      },
      user: {
        configurable: false,
        enumerable: true,
        value: '',
        writable: true
      }
    });

    proto.abort = function abort() {
      var client = this.client;
      return client.abort.apply(client, arguments);
    };

    proto.handleEvent = function handleEvent(event) {
      var type = event.type;
      var methodName = type === 'response' ? 'receiveResponse' : '';
      var method = this[methodName];
      if (typeof method !== 'function') {
        return;
      }
      return method.apply(this, arguments);
    };

    proto.open = function open(method, uri, async, user, password) {
      this.async = !!async;
      this.uri = uri;
      this.user = user || '';
      this.password = password || '';
    };

    proto.receiveResponse = function receiveResponse() {
      console.log(arguments);
    };

    proto.send = function send(body) {
      var client = this.client;
      client.end();
    };
  })(Request.prototype);

  function ClientRequest(options, request) {
    this.request = request;
    http.ClientRequest.call(this, options);
  }

  ClientRequest.prototype = Object.create(http.ClientRequest.prototype);

  (function(proto) {
    Object.defineProperties(proto, {
      response: {
        configurable: false,
        enumerable: true,
        get: function getter() {
          var response = this.res
          return response || null;
        }
      },
      request: {
        configurable: false,
        enumerable: true,
        value: null,
        writable: true
      }
    });

    proto.emit = function emit(type) {
      var request = this.request;
      var originalEmit = http.ClientRequest.prototype.emit;
      var event;
      if (!request || typeof request.dispatchEvent !== 'function') {
        return originalEmit.apply(this, arguments);
      }
      event = new Event(type);
      event.initEvent(event.type, false, false);
      request.dispatchEvent(event);
      return originalEmit.apply(this, arguments);
    };
  })(ClientRequest.prototype);

  module.exports = Request;
})(this);
