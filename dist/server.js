/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = function(message, code, error, smtp) {
  var err = new Error((error && error.message) ? message + ' (' + error.message + ')' : message);
  err.code = code;
  if(error)
    err.previous = error;
  err.smtp = smtp;

  return err;
};

module.exports.COULDNOTCONNECT =	1;
module.exports.BADRESPONSE = 2;
module.exports.AUTHFAILED = 3;
module.exports.TIMEDOUT = 4;
module.exports.ERROR = 5;
module.exports.NOCONNECTION = 6;
module.exports.AUTHNOTSUPPORTED = 7;
module.exports.CONNECTIONCLOSED = 8;
module.exports.CONNECTIONENDED = 9;
module.exports.CONNECTIONAUTH = 10;


/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("@angular/platform-server");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("@angular/core");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

/*
 * SMTP class written using python's (2.7) smtplib.py as a base
 */
var net = __webpack_require__(21);
var crypto = __webpack_require__(22);
var os = __webpack_require__(6);
var tls = __webpack_require__(23);
var util = __webpack_require__(7);
var events = __webpack_require__(24);

var SMTPResponse = __webpack_require__(25);
var SMTPError = __webpack_require__(0);

var SMTP_PORT = 25;
var SMTP_SSL_PORT = 465;
var SMTP_TLS_PORT = 587;
var CRLF = "\r\n";
var AUTH_METHODS = {
  PLAIN: 'PLAIN',
  CRAM_MD5: 'CRAM-MD5',
  LOGIN: 'LOGIN',
  XOAUTH2: 'XOAUTH2'
};
var TIMEOUT = 5000;
var DEBUG = 0;

var log = function() {
  if (DEBUG) {
    Array.prototype.slice.call(arguments).forEach(function(d) {
      console.log(d);
    });
  }
};

var quotedata = function(data) {
  // Quote data for email.
  // Double leading '.', and change Unix newline '\\n', or Mac '\\r' into
  // Internet CRLF end-of-line.

  return data.replace(/(?:\r\n|\n|\r(?!\n))/g, CRLF).replace(/^\./gm, '..');
};

var caller = function(callback) {
  if (typeof(callback) == 'function') {
    var args = Array.prototype.slice.call(arguments);
    args.shift();

    callback.apply(null, args);
  }
};

var SMTPState = {
  NOTCONNECTED: 0,
  CONNECTING: 1,
  CONNECTED: 2
};

var SMTP = function(options) {
  events.EventEmitter.call(this);

  options = options || {};

  this.sock = null;
  this.timeout = options.timeout || TIMEOUT;
  this.features = null;
  this._state = SMTPState.NOTCONNECTED;
  this._secure = false;
  this.loggedin = (options.user && options.password) ? false : true;
  this.domain = options.domain || os.hostname();
  this.host = options.host || 'localhost';
  this.port = options.port || (options.ssl ? SMTP_SSL_PORT : options.tls ? SMTP_TLS_PORT : SMTP_PORT);
  this.ssl = options.ssl || false;
  this.tls = options.tls || false;
  this.monitor = null;
  this.authentication = options.authentication || [AUTH_METHODS.CRAM_MD5, AUTH_METHODS.LOGIN, AUTH_METHODS.PLAIN, AUTH_METHODS.XOAUTH2];

  // keep these strings hidden when quicky debugging/logging
  this.user = function() {
    return options.user;
  };
  this.password = function() {
    return options.password;
  };
};

SMTP.prototype = {
  debug: function(level) {
    DEBUG = level;
  },

  state: function() {
    return this._state;
  },

  authorized: function() {
    return this.loggedin;
  },

  connect: function(callback, port, host, options) {
    options = options || {};

    var self = this;

    self.host = host || self.host;
    self.port = port || self.port;
    self.ssl = options.ssl || self.ssl;

    if (self._state != SMTPState.NOTCONNECTED) {
      self.quit(function() {
        self.connect(callback, port, host, options);
      });
      return;
    }

    var connected = function(err) {
      if (!err) {
        log("connected: " + self.host + ":" + self.port);

        if (self.ssl && !self.tls) {
          // if key/ca/cert was passed in, check if connection is authorized
          if (typeof(self.ssl) != 'boolean' && !self.sock.authorized) {
            self.close(true);
            caller(callback, SMTPError('could not establish an ssl connection', SMTPError.CONNECTIONAUTH, err));
          } else self._secure = true;
        }
      } else {
        self.close(true);
        caller(callback, SMTPError("could not connect", SMTPError.COULDNOTCONNECT, err));
      }
    };

    var response = function(err, msg) {
      if (err) {
        if (self._state === SMTPState.NOTCONNECTED && !self.sock) {
          return;
        }
        self.close(true);
        caller(callback, err);
      } else if (msg.code == '220') {
        log(msg.data);

        // might happen first, so no need to wait on connected()
        self._state = SMTPState.CONNECTED;
        caller(callback, null, msg.data);
      } else {
        log("response (data): " + msg.data);
        self.quit(function() {
          caller(callback, SMTPError("bad response on connection", SMTPError.BADRESPONSE, err, msg.data));
        });
      }
    };

    self._state = SMTPState.CONNECTING;
    log("connecting: " + self.host + ":" + self.port);

    if (self.ssl) {
      self.sock = tls.connect(self.port, self.host, self.ssl, connected);
    } else {
      self.sock = new net.Socket();
      self.sock.connect(self.port, self.host, connected);
    }

    self.monitor = SMTPResponse.monitor(self.sock, self.timeout, function() {
      self.close(true);
    });
    self.sock.once('response', response);
    self.sock.once('error', response); // the socket could reset or throw, so let's handle it and let the user know
  },

  send: function(str, callback) {
    var self = this;

    if (self.sock && self._state == SMTPState.CONNECTED) {
      log(str);

      var response = function(err, msg) {
        if (err) {
          caller(callback, err);
        } else {
          log(msg.data);
          caller(callback, null, msg);
        }
      };

      self.sock.once('response', response);
      self.sock.write(str);
    } else {
      self.close(true);
      caller(callback, SMTPError('no connection has been established', SMTPError.NOCONNECTION));
    }
  },

  command: function(cmd, callback, codes, failed) {
    codes = Array.isArray(codes) ? codes : typeof(codes) == 'number' ? [codes] : [250];

    var response = function(err, msg) {
      if (err) {
        caller(callback, err);
      } else {
        if (codes.indexOf(Number(msg.code)) != -1) {
          caller(callback, err, msg.data, msg.message);
        } else {
          var errorMessage = "bad response on command '" + cmd.split(' ')[0] + "'";
          if (msg.message) {
            errorMessage += ': ' + msg.message;
          }
          caller(callback, SMTPError(errorMessage, SMTPError.BADRESPONSE, null, msg.data));
        }
      }
    };

    this.send(cmd + CRLF, response);
  },

  helo: function(callback, domain) {
    /*
     * SMTP 'helo' command.
     * Hostname to send for self command defaults to the FQDN of the local
     * host.
     */

    var self = this,

      response = function(err, data) {
        if (err) {
          caller(callback, err);
        } else {
          self.parse_smtp_features(data);
          caller(callback, err, data);
        }
      };

    this.command("helo " + (domain || this.domain), response);
  },

  starttls: function(callback) {
    var self = this,

      response = function(err, msg) {
        if (err) {
          err.message += " while establishing a starttls session";
          caller(callback, err);
        } else {
          // support new API
          if (tls.TLSSocket) {
            var secured_socket = new tls.TLSSocket(self.sock, {
              secureContext: tls.createSecureContext ? tls.createSecureContext(self.tls) : crypto.createCredentials(self.tls),
              isServer: false // older versions of node (0.12), do not default to false properly...
            });

            secured_socket.on('error', function(err) {
              self.close(true);
              caller(callback, err);
            });

            self._secure = true;
            self.sock = secured_socket;

            SMTPResponse.monitor(self.sock, self.timeout, function() {
              self.close(true);
            });
            caller(callback, msg.data);
          } else {
            var secured_socket = null;
            var secured = function() {
              self._secure = true;
              self.sock = secured_socket;

              var error = function(err) {
                self.close(true);
                caller(callback, err);
              };

              SMTPResponse.monitor(self.sock, self.timeout, function() {
                self.close(true);
              });
              caller(callback, msg.data);
            };

            //secured_socket = starttls.secure(self.sock, self.tls, secured);
            var starttls = __webpack_require__(26);
            secured_socket = starttls({
              socket: self.sock,
              host: self.host,
              port: self.port,
              pair: tls.createSecurePair(
                tls.createSecureContext ? tls.createSecureContext(self.tls) : crypto.createCredentials(self.tls), 
                false)
            }, secured).cleartext;

            secured_socket.on('error', function(err) {
              self.close(true);
              caller(callback, err);
            });
          }
        }
      };

    this.command("starttls", response, [220]);
  },

  parse_smtp_features: function(data) {
    var self = this;

    //  According to RFC1869 some (badly written)
    //  MTA's will disconnect on an ehlo. Toss an exception if
    //  that happens -ddm

    data.split("\n").forEach(function(ext) {
      var parse = ext.match(/^(?:\d+[\-=]?)\s*?([^\s]+)(?:\s+(.*)\s*?)?$/);

      // To be able to communicate with as many SMTP servers as possible,
      // we have to take the old-style auth advertisement into account,
      // because:
      // 1) Else our SMTP feature parser gets confused.
      // 2) There are some servers that only advertise the auth methods we
      // support using the old style.

      if (parse) {
        // RFC 1869 requires a space between ehlo keyword and parameters.
        // It's actually stricter, in that only spaces are allowed between
        // parameters, but were not going to check for that here.  Note
        // that the space isn't present if there are no parameters.
        self.features[parse[1].toLowerCase()] = parse[2] || true;
      }
    });

    return;
  },

  ehlo: function(callback, domain) {
    var self = this,

      response = function(err, data) {
        if (err) {
          caller(callback, err);
        } else {
          self.parse_smtp_features(data);

          if (self.tls && !self._secure) {
            self.starttls(function() {
              self.ehlo(callback, domain);
            });
          } else {
            caller(callback, err, data);
          }
        }
      };

    this.features = {};
    this.command("ehlo " + (domain || this.domain), response);
  },

  has_extn: function(opt) {
    return this.features[opt.toLowerCase()] === undefined;
  },

  help: function(callback, args) {
    // SMTP 'help' command, returns text from the server
    this.command(args ? "help " + args : "help", callback, [211, 214]);
  },

  rset: function(callback) {
    this.command("rset", callback);
  },

  noop: function(callback) {
    this.send("noop", callback);
  },

  mail: function(callback, from) {
    this.command("mail FROM:" + from, callback);
  },

  rcpt: function(callback, to) {
    this.command("RCPT TO:" + to, callback, [250, 251]);
  },

  data: function(callback) {
    this.command("data", callback, [354]);
  },

  data_end: function(callback) {
    this.command(CRLF + ".", callback);
  },

  message: function(data) {
    log(data);
    this.sock.write(data);
  },

  verify: function(address, callback) {
    // SMTP 'verify' command -- checks for address validity."""
    this.command("vrfy " + address, callback, [250, 251, 252]);
  },

  expn: function(address, callback) {
    // SMTP 'expn' command -- expands a mailing list.
    this.command("expn " + address, callback);
  },

  ehlo_or_helo_if_needed: function(callback, domain) {
    // Call self.ehlo() and/or self.helo() if needed.                                 
    // If there has been no previous EHLO or HELO command self session, self
    //  method tries ESMTP EHLO first.
    var self = this;

    if (!this.features) {
      var response = function(err, data) {
        caller(callback, err, data);
      };

      var attempt = function(err, data) {
        if (err) self.helo(response, domain);
        else caller(callback, err, data);
      };

      self.ehlo(attempt, domain);
    }
  },

  login: function(callback, user, password, options) {
    var self = this,

      login = {
        user: user ? function() {
          return user;
        } : self.user,
        password: password ? function() {
          return password;
        } : self.password,
        method: options && options.method ? options.method.toUpperCase() : ''
      },

      domain = options && options.domain ? options.domain : this.domain,

      initiate = function(err, data) {
        if (err) {
          caller(callback, err);
          return;
        }

        /* 
         * Log in on an SMTP server that requires authentication.
         *
         * The arguments are:
         *     - user:     The user name to authenticate with.
         *     - password: The password for the authentication.
         *
         * If there has been no previous EHLO or HELO command self session, self
         * method tries ESMTP EHLO first.
         *
         * This method will return normally if the authentication was successful.
         */

        var method = null,

          encode_cram_md5 = function(challenge) {
            challenge = (new Buffer(challenge, "base64")).toString("ascii");

            var hmac = crypto.createHmac('md5', login.password());
            hmac.update(challenge);

            return (new Buffer(login.user() + " " + hmac.digest('hex')).toString("base64"));
          },

          encode_plain = function() {
            return (new Buffer("\u0000" + login.user() + "\u0000" + login.password())).toString("base64");
          },

          encode_xoauth2 = function() {
            // console.log("user=" + login.user() + "\1auth=Bearer " + login.password()+"\1\1"); 
            // see: https://developers.google.com/gmail/xoauth2_protocol
            return (new Buffer("user=" + login.user() + "\u0001auth=Bearer " + login.password() + "\u0001\u0001")).toString("base64");
          };

        // List of authentication methods we support: from preferred to
        // less preferred methods.
        if (!method) {
          var preferred = self.authentication;
          var auth = "";

          if (self.features && self.features.auth) {
            if (typeof(self.features.auth) === 'string') {
              auth = self.features.auth;
            }
          }

          for (var i = 0; i < preferred.length; i++) {
            if (auth.indexOf(preferred[i]) != -1) {
              method = preferred[i];
              break;
            }
          }
        }

        // handle bad responses from command differently
        var failed = function(err, data) {
          self.loggedin = false;
          self.close(); // if auth is bad, close the connection, it won't get better by itself
          caller(callback, SMTPError('authorization.failed', SMTPError.AUTHFAILED, err, data));
        };

        var response = function(err, data) {
          if (err) {
            failed(err, data);
          } else {
            self.loggedin = true;
            caller(callback, err, data);
          }
        };

        var attempt = function(err, data, msg) {
          if (err) {
            failed(err, data);
          } else {
            if (method == AUTH_METHODS.CRAM_MD5) {
              self.command(encode_cram_md5(msg), response, [235, 503]);
            } else if (method == AUTH_METHODS.LOGIN) {
              self.command((new Buffer(login.password())).toString("base64"), response, [235, 503]);
            }
          }
        };

        var attempt_user = function(err, data, msg) {
          if (err) {
            failed(err, data);
          } else {
            if (method == AUTH_METHODS.LOGIN) {
              self.command((new Buffer(login.user())).toString("base64"), attempt, [334]);
            }
          }
        };

        if (method == AUTH_METHODS.CRAM_MD5) self.command("AUTH " + AUTH_METHODS.CRAM_MD5, attempt, [334]);

        else if (method == AUTH_METHODS.LOGIN) self.command("AUTH " + AUTH_METHODS.LOGIN, attempt_user, [334]);

        else if (method == AUTH_METHODS.PLAIN) self.command("AUTH " + AUTH_METHODS.PLAIN + " " + encode_plain(login.user(), login.password()), response, [235, 503]);

        else if (method == AUTH_METHODS.XOAUTH2) self.command("AUTH " + AUTH_METHODS.XOAUTH2 + " " + encode_xoauth2(login.user(), login.password()), response, [235, 503]);

        else if (!method) caller(callback, SMTPError('no form of authorization supported', SMTPError.AUTHNOTSUPPORTED, null, data));
      };

    self.ehlo_or_helo_if_needed(initiate, domain);
  },

  close: function(force) {
    if (this.sock) {
      if (force) {
        log("smtp connection destroyed!");
        this.sock.destroy();
      } else {
        log("smtp connection closed.");
        this.sock.end();
      }
    }

    if (this.monitor) {
      this.monitor.stop();
      this.monitor = null;
    }

    this._state = SMTPState.NOTCONNECTED;
    this._secure = false;
    this.sock = null;
    this.features = null;
    this.loggedin = !(this.user() && this.password());
  },

  quit: function(callback) {
    var self = this,
      response = function(err, data) {
        caller(callback, err, data);
        self.close();
      };

    this.command("quit", response, [221, 250]);
  }
};

for (var each in events.EventEmitter.prototype) {
  SMTP.prototype[each] = events.EventEmitter.prototype[each];
}

exports.SMTP = SMTP;
exports.state = SMTPState;
exports.authentication = AUTH_METHODS;


/***/ }),
/* 6 */
/***/ (function(module, exports) {

module.exports = require("os");

/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var stream     = __webpack_require__(27);
var util       = __webpack_require__(7);
var fs         = __webpack_require__(4);
var os         = __webpack_require__(6);
var path       = __webpack_require__(3);
var moment     = __webpack_require__(28);
var mimelib    = __webpack_require__(29);
var addressparser = __webpack_require__(9);
var CRLF       = "\r\n";
var MIMECHUNK  = 76; // MIME standard wants 76 char chunks when sending out.
var BASE64CHUNK= 24; // BASE64 bits needed before padding is used
var MIME64CHUNK= MIMECHUNK * 6; // meets both base64 and mime divisibility
var BUFFERSIZE = MIMECHUNK*24*7; // size of the message stream buffer
var counter    = 0;

// support for nodejs without Buffer.concat native function
if(!Buffer.concat)
{
   __webpack_require__(30);
}

var generate_boundary = function()
{
   var text       = "";
   var possible    = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'()+_,-./:=?";

   for(var i=0; i < 69; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

   return text;
};

function person2address(l)
{
  var addresses = addressparser(l);
  return addresses.map(function(addr) {
    return addr.name ? mimelib.encodeMimeWord(addr.name, 'Q', 'utf-8').replace(/,/g, '=2C') + ' ' + '<' + addr.address + '>' : addr.address;
  }).join(', ');
}

var fix_header_name_case = function(header_name) {
    return header_name.toLowerCase().replace(/^(.)|-(.)/g, function(match) {
        return match.toUpperCase();
    });
};

var Message = function(headers)
{
   this.attachments  = [];
   this.alternative  = null;
   var now = new Date();
   this.header       = {
      "message-id":"<" + now.getTime() + "." + (counter++) + "." + process.pid + "@" + os.hostname() +">",
      "date":moment().locale('en').format("ddd, DD MMM YYYY HH:mm:ss ZZ")
   };
   this.content      = "text/plain; charset=utf-8";

   for(var header in headers)
   {
      // allow user to override default content-type to override charset or send a single non-text message
      if(/^content-type$/i.test(header))
      {
         this.content = headers[header];
      }
      else if(header == 'text')
      {
         this.text = headers[header];
      }
      else if(header == "attachment" && typeof (headers[header]) == "object")
      {
         if(Array.isArray(headers[header])) {
            var that = this;

            for (var i = 0, l = headers[header].length; i < l; i++) {
              this.attach(headers[header][i]);
            }
         } else {
            this.attach(headers[header]);
         }
      }
      else if(header == 'subject')
      {
         this.header.subject = mimelib.encodeMimeWord(headers.subject, 'Q', 'utf-8');
      }
      else if(/^(cc|bcc|to|from)/i.test(header))
      {
         this.header[header.toLowerCase()] = person2address(headers[header]);
      }
      else
      {
         // allow any headers the user wants to set??
         // if(/cc|bcc|to|from|reply-to|sender|subject|date|message-id/i.test(header))
         this.header[header.toLowerCase()] = headers[header];
      }
   }
};

Message.prototype =
{
   attach: function(options)
   {
      /*
         legacy support, will remove eventually...
         arguments -> (path, type, name, headers)
      */
      if (arguments.length > 1)
        options = {path:options, type:arguments[1], name:arguments[2]};

      // sender can specify an attachment as an alternative
      if(options.alternative)
      {
         this.alternative           = options;
         this.alternative.charset   = options.charset || "utf-8";
         this.alternative.type      = options.type || "text/html";
         this.alternative.inline    = true;
      }
      else
         this.attachments.push(options);

      return this;
   },

   /*
      legacy support, will remove eventually...
      should use Message.attach() instead
   */
   attach_alternative: function(html, charset)
   {
      this.alternative =
      {
         data:    html,
         charset: charset || "utf-8",
         type:    "text/html",
         inline:  true
      };

      return this;
   },

   valid: function(callback)
   {
      var self = this;

      if(!self.header.from)
      {
         callback(false, "message does not have a valid sender");
      }
      if(!(self.header.to || self.header.cc || self.header.bcc))
      {
         callback(false, "message does not have a valid recipient");
      }
      else if(self.attachments.length === 0)
      {
         callback(true);
      }
      else
      {
         var check  = [];
         var failed = [];

         self.attachments.forEach(function(attachment, index)
         {
            if(attachment.path)
            {
               // migrating path->fs for existsSync)
               if(!(fs.existsSync || path.existsSync)(attachment.path))
                  failed.push(attachment.path + " does not exist");
            }
            else if(attachment.stream)
            {
               if(!attachment.stream.readable)
                  failed.push("attachment stream is not readable");
            }
            else if(!attachment.data)
            {
               failed.push("attachment has no data associated with it");
            }
         });

         callback(failed.length === 0, failed.join(", "));
      }
   },

   stream: function()
   {
      return new MessageStream(this);
   },

   read: function(callback)
   {
      var buffer = "";

      var capture = function(data)
      {
         buffer += data;
      };

      var output = function(err)
      {
         callback(err, buffer);
      };

      var str = this.stream();

      str.on('data', capture);
      str.on('end', output);
      str.on('error', output);
   }
};

var MessageStream = function(message)
{
   var self       = this;

   stream.Stream.call(self);

   self.message   = message;
   self.readable  = true;
   self.paused    = false;
   self.buffer    = new Buffer(MIMECHUNK*24*7);
   self.bufferIndex = 0;

   var output_process = function(next, args)
   {
      if(self.paused)
      {
         self.resumed = function() { next.apply(null, args); };
      }
      else
      {
         next.apply(null, args);
      }

      next.apply(null, args);
   };

   var output_mixed = function()
   {
      var boundary   = generate_boundary();
      var data       = ["Content-Type: multipart/mixed; boundary=\"", boundary, "\"", CRLF, CRLF, "--", boundary, CRLF];

      output(data.join(''));

      if(!self.message.alternative)
      {
         output_text(self.message);
         output_message(boundary, self.message.attachments, 0, close);
      }
      else
      {
         output_alternative(self.message, function() { output_message(boundary, self.message.attachments, 0, close); });
      }
   };

   var output_message = function(boundary, list, index, callback)
   {
      if(index < list.length)
      {
         output(["--", boundary, CRLF].join(''));

         if(list[index].related)
         {
            output_related(list[index], function() { output_message(boundary, list, index + 1, callback); });
         }
         else
         {
            output_attachment(list[index], function() { output_message(boundary, list, index + 1, callback); });
         }
      }
      else
      {
         output([CRLF, "--", boundary, "--", CRLF, CRLF].join(''));
         callback();
      }
   };

   var output_attachment_headers = function(attachment)
   {
      var data = [],
          header,
          headers =
          {
            'content-type': attachment.type +
              (attachment.charset ? "; charset=" + attachment.charset : "") +
              (attachment.method ? "; method=" + attachment.method : ""),
            'content-transfer-encoding': 'base64',
            'content-disposition': attachment.inline ? 'inline' : 'attachment; filename="' + mimelib.encodeMimeWord(attachment.name, 'Q', 'utf-8') + '"'
          };

      for(header in (attachment.headers || {}))
      {
         // allow sender to override default headers
         headers[header.toLowerCase()] = attachment.headers[header];
      }

      for(header in headers)
      {
         data = data.concat([fix_header_name_case(header), ': ', headers[header], CRLF]);
      }

      output(data.concat([CRLF]).join(''));
   };

   var output_attachment = function(attachment, callback)
   {
      var build = attachment.path ? output_file : attachment.stream ? output_stream : output_data;
      output_attachment_headers(attachment);
      build(attachment, callback);
   };

   var output_data = function(attachment, callback)
   {
      output_base64(attachment.encoded ? attachment.data : new Buffer(attachment.data).toString("base64"), callback);
   };

   var output_file = function(attachment, next)
   {
      var chunk      = MIME64CHUNK*16;
      var buffer     = new Buffer(chunk);
      var closed     = function(fd) { if(fs.close) { fs.close(fd); } };
      var opened     = function(err, fd)
      {
         if(!err)
         {
            var read = function(err, bytes)
            {
               if(!err && self.readable)
               {
                  var encoding = attachment && attachment.headers ? attachment.headers['content-transfer-encoding'] || 'base64' : 'base64';

                  if (encoding === 'ascii' || encoding === '7bit')  {
                    encoding = 'ascii';
                  } else if(encoding === 'binary' || encoding === '8bit')  {
                    encoding = 'binary';
                  } else {
                    encoding = 'base64';
                  }

                  // guaranteed to be encoded without padding unless it is our last read
                  output_base64(buffer.toString(encoding, 0, bytes), function()
                  {
                     if(bytes == chunk) // we read a full chunk, there might be more
                     {
                        fs.read(fd, buffer, 0, chunk, null, read);
                     }
                     else // that was the last chunk, we are done reading the file
                     {
                        self.removeListener("error", closed);
                        fs.close(fd, next);
                     }
                  });
               }
               else
               {
                  self.emit('error', err || {message:"message stream was interrupted somehow!"});
               }
            };

            fs.read(fd, buffer, 0, chunk, null, read);
            self.once("error", closed);
         }
         else
            self.emit('error', err);
      };

      fs.open(attachment.path, 'r', opened);
   };

   var output_stream = function(attachment, callback)
   {
      if(attachment.stream.readable)
      {
         var previous = null;

         attachment.stream.resume();
         attachment.stream.on('end', function()
         {
            output_base64((previous || new Buffer(0)).toString("base64"), callback);
            self.removeListener('pause', attachment.stream.pause);
            self.removeListener('resume', attachment.stream.resume);
            self.removeListener('error', attachment.stream.resume);
         });

         attachment.stream.on('data', function(buffer)
         {
            // do we have bytes from a previous stream data event?
            if(previous)
            {
               var buffer2 = Buffer.concat([previous, buffer]);
               previous    = null; // free up the buffer
               buffer      = null; // free up the buffer
               buffer      = buffer2;
            }

            var padded = buffer.length % (MIME64CHUNK);

            // encode as much of the buffer to base64 without empty bytes
            if(padded)
            {
               previous = new Buffer(padded);
               // copy dangling bytes into previous buffer
               buffer.copy(previous, 0, buffer.length - padded);
            }

            output_base64(buffer.toString("base64", 0, buffer.length - padded));
         });

         self.on('pause', attachment.stream.pause);
         self.on('resume', attachment.stream.resume);
         self.on('error', attachment.stream.resume);
      }
      else
         self.emit('error', {message:"stream not readable"});
   };

   var output_base64 = function(data, callback)
   {
      var loops   = Math.ceil(data.length / MIMECHUNK);
      var loop    = 0;

      while(loop < loops)
      {
        output(data.substring(MIMECHUNK * loop, MIMECHUNK * (loop + 1)) + CRLF);
        loop++;
      }

      if(callback)
        callback();
   };

   var output_text = function(message)
   {
      var data = [];

      data = data.concat(["Content-Type:", message.content, CRLF, "Content-Transfer-Encoding: 7bit", CRLF]);
      data = data.concat(["Content-Disposition: inline", CRLF, CRLF]);
      data = data.concat([message.text || "", CRLF, CRLF]);

      output(data.join(''));
   };

   var output_alternative = function(message, callback)
   {
      var data = [], boundary = generate_boundary();

      data     = data.concat(["Content-Type: multipart/alternative; boundary=\"", boundary, "\"", CRLF, CRLF]);
      data     = data.concat(["--", boundary, CRLF]);

      output(data.join(''));
      output_text(message);
      output(["--", boundary, CRLF].join(''));

      var finish = function()
      {
         output([CRLF, "--", boundary, "--", CRLF, CRLF].join(''));
         callback();
      };

      if(message.alternative.related)
      {
         output_related(message.alternative, finish);
      }
      else
      {
         output_attachment(message.alternative, finish);
      }
   };

   var output_related = function(message, callback)
   {
      var data = [], boundary = generate_boundary();

      data     = data.concat(["Content-Type: multipart/related; boundary=\"", boundary, "\"", CRLF, CRLF]);
      data     = data.concat(["--", boundary, CRLF]);

      output(data.join(''));

      output_attachment(message, function()
      {
         output_message(boundary, message.related, 0, function()
         {
            output([CRLF, "--", boundary, "--", CRLF, CRLF].join(''));
            callback();
         });
      });
   };

   var output_header_data = function()
   {
      if(self.message.attachments.length || self.message.alternative)
      {
         output("MIME-Version: 1.0" + CRLF);
         output_mixed();
      }
      else // you only have a text message!
      {
         output_text(self.message);
         close();
      }
   };

   var output_header = function()
   {
      var data = [];

      for(var header in self.message.header)
      {
         // do not output BCC in the headers (regex) nor custom Object.prototype functions...
         if(!(/bcc/i.test(header)) && self.message.header.hasOwnProperty (header))
            data = data.concat([fix_header_name_case(header), ": ", self.message.header[header], CRLF]);
      }

      output(data.join(''));
      output_header_data();
   };

   var output = function(data, callback, args)
   {
      var bytes = Buffer.byteLength(data);

      // can we buffer the data?
      if(bytes + self.bufferIndex < self.buffer.length)
      {
         self.buffer.write(data, self.bufferIndex);
         self.bufferIndex += bytes;

         if(callback)
            callback.apply(null, args);
      }
      // we can't buffer the data, so ship it out!
      else if(bytes > self.buffer.length)
      {
         if(self.bufferIndex)
         {
            self.emit('data', self.buffer.toString("utf-8", 0, self.bufferIndex));
            self.bufferIndex = 0;
         }

         var loops   = Math.ceil(data.length / self.buffer.length);
         var loop    = 0;

         while(loop < loops)
         {
           self.emit('data', data.substring(self.buffer.length*loop, self.buffer.length*(loop + 1)));
           loop++;
         }
      }
      else // we need to clean out the buffer, it is getting full
      {
         if(!self.paused)
         {
            self.emit('data', self.buffer.toString("utf-8", 0, self.bufferIndex));
            self.buffer.write(data, 0);
            self.bufferIndex = bytes;

            // we could get paused after emitting data...
            if(self.paused)
            {
               self.once("resume", function() { callback.apply(null, args); });
            }
            else if(callback)
            {
               callback.apply(null, args);
            }
         }
         else // we can't empty out the buffer, so let's wait till we resume before adding to it
         {
            self.once("resume", function() { output(data, callback, args); });
         }
      }
   };

   var close = function(err)
   {
      if(err)
      {
         self.emit("error", err);
      }
      else
      {
         self.emit('data', self.buffer.toString("utf-8", 0, self.bufferIndex));
         self.emit('end');
      }

      self.buffer = null;
      self.bufferIndex = 0;
      self.readable = false;
      self.removeAllListeners("resume");
      self.removeAllListeners("pause");
      self.removeAllListeners("error");
      self.removeAllListeners("data");
      self.removeAllListeners("end");
   };

   self.once("destroy", close);
   process.nextTick(output_header);
};

util.inherits(MessageStream, stream.Stream);

MessageStream.prototype.pause = function()
{
   this.paused = true;
   this.emit('pause');
};

MessageStream.prototype.resume = function()
{
   this.paused = false;
   this.emit('resume');
};

MessageStream.prototype.destroy = function()
{
   this.emit("destroy", self.bufferIndex > 0 ? {message:"message stream destroyed"} : null);
};

MessageStream.prototype.destroySoon = function()
{
   this.emit("destroy");
};

exports.Message = Message;
exports.BUFFERSIZE = BUFFERSIZE;
exports.create = function(headers)
{
   return new Message(headers);
};


/***/ }),
/* 9 */
/***/ (function(module, exports) {

module.exports = require("addressparser");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(11);
__webpack_require__(12);
var platform_server_1 = __webpack_require__(1);
var core_1 = __webpack_require__(2);
var express = __webpack_require__(13);
var compression = __webpack_require__(14);
var path_1 = __webpack_require__(3);
var fs_1 = __webpack_require__(4);
var domino = __webpack_require__(15); // provee de dom al server
__webpack_require__(16).load();
var bodyParser = __webpack_require__(17);
var ctrlEmail = __webpack_require__(18);
core_1.enableProdMode();
console.log("process.env.PORT: " + process.env.PORT);
var PORT = process.env.PORT || 4200;
var DIST_FOLDER = path_1.join(process.cwd(), 'dist');
var app = express();
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var template = fs_1.readFileSync(path_1.join(DIST_FOLDER, 'browser', 'index.html')).toString();
var win = domino.createWindow(template);
global['window'] = win;
global['document'] = win.document;
var AppServerModuleNgFactory = __webpack_require__(31).AppServerModuleNgFactory;
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.engine('html', function (_, options, callback) {
    var opts = { document: template, url: options.req.url };
    platform_server_1.renderModuleFactory(AppServerModuleNgFactory, opts)
        .then(function (html) { return callback(null, html); });
});
app.set('view engine', 'html');
app.set('views', 'src');
app.get('*.*', express.static(path_1.join(DIST_FOLDER, 'browser')));
app.get('*', function (req, res) {
    res.render('index', { req: req });
});
/*app.post('/email', (request, response) => {
    ctrlEmail.sendEmail;
});

app.post('/emailServ/:servicioid', (request, response) => {
    ctrlEmail.sendEmailPrice;
});*/
app.post('/email', ctrlEmail.sendEmail);
app.post('/emailServ/:servicioid', ctrlEmail.sendEmailPrice);
app.listen(PORT, function () {
    console.log("listening on http://localhost:" + PORT + "!");
});


/***/ }),
/* 11 */
/***/ (function(module, exports) {

module.exports = require("reflect-metadata");

/***/ }),
/* 12 */
/***/ (function(module, exports) {

module.exports = require("zone.js/dist/zone-node");

/***/ }),
/* 13 */
/***/ (function(module, exports) {

module.exports = require("express");

/***/ }),
/* 14 */
/***/ (function(module, exports) {

module.exports = require("compression");

/***/ }),
/* 15 */
/***/ (function(module, exports) {

module.exports = require("domino");

/***/ }),
/* 16 */
/***/ (function(module, exports) {

module.exports = require("dotenv");

/***/ }),
/* 17 */
/***/ (function(module, exports) {

module.exports = require("body-parser");

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

var email = __webpack_require__(19);//..../node_modules/emailjs/email
var sendJSONresponse = function(res, status, content) {
	res.status(status);
	res.json(content);
};



console.log(process.env.USER_MAIL + ' ' +process.env.SECRET_MAIL);

var server 	= email.server.connect({
   user:    process.env.USER_MAIL, 
   password:process.env.SECRET_MAIL, 
   host:    "smtp.gmail.com", 
   ssl:     true
});

function auto(contacto,res){
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Solicitud de Cotización de Automoviles para "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, tienes una solicitud de cotización para el servicio de Automoviles. Los datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Fecha de Nacimiento: '+contacto.fecha+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Cédula : '+contacto.cedulaTipo+' '+contacto.cedula +'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Marca del auto : '+contacto.marca+' Modelo: '+contacto.modelo +' y año: '+ contacto.year + '</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Versión del auto : '+contacto.version+' y Transmisión: '+contacto.tipoCaja +'</a><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estas solicitudes.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
		},
		function(err, message) { 

			console.log(err || message); 


			if (err) {
				sendJSONresponse(res, 404, err);//en caso de error se envia el error
				return;
			}else {

				sendJSONresponse(res, 200, message);
			}

		});
	
}

function inversiones(contacto,res){
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Solicitud de Cotización de Inversiones para "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, tienes una solicitud de cotización para el servicio de Inversiones. Los datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Es fumador? : '+contacto.tipofumador+'</a><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estas solicitudes.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
		},
		function(err, message) { 

			console.log(err || message); 


			if (err) {
				sendJSONresponse(res, 404, err);//en caso de error se envia el error
				return;
			}else {

				sendJSONresponse(res, 200, message);
			}

		});
	
}



function salud(contacto,res){
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Solicitud de Cotización de Salud para "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, tienes una solicitud de cotización para el servicio de Salud. Los datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Fecha de Nacimiento: '+contacto.fecha+'</a><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estas solicitudes.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
		},
		function(err, message) { 

			console.log(err || message); 


			if (err) {
				sendJSONresponse(res, 404, err);//en caso de error se envia el error
				return;
			}else {

				sendJSONresponse(res, 200, message);
			}

		});
	
}





function patrimonio(contacto,res){
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Solicitud de Cotización de Patrimonios para "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, tienes una solicitud de cotización para el servicio de Patrimonios. Los datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estas solicitudes.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
		},
		function(err, message) { 

			console.log(err || message); 


			if (err) {
				sendJSONresponse(res, 404, err);//en caso de error se envia el error
				return;
			}else {

				sendJSONresponse(res, 200, message);
			}

		});
	
}


function viajes(contacto,res){
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Solicitud de Cotización de VIAJES para "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, tienes una solicitud de cotización para un seguro de Viajes. Los datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Edad: '+contacto.edad+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Tipo de viaje: '+contacto.tipoViaje+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Fecha de salida: '+contacto.fechaIda+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Fecha de regreso: '+contacto.fechaVuelta+'</a><br><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estas solicitudes.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
		},
		function(err, message) { 

			console.log(err || message); 


			if (err) {
				sendJSONresponse(res, 404, err);//en caso de error se envia el error
				return;
			}else {

				sendJSONresponse(res, 200, message);
			}

		});
	
}

module.exports.sendEmailPrice = function(req,res){

	var servicioid= req.params.servicioid;

	var info= req.body;

	console.log("el servicio id es  " + servicioid);
	console.log("la información es  " + JSON.stringify(info));

	if (servicioid==='Viajes') {
		viajes(info,res);
	}else if (servicioid==='Patrimonios') {
		patrimonio(info,res);
	}else if (servicioid==='Salud') {
		salud(info,res);
	}else if (servicioid==='Inversiones') {
		inversiones(info,res)
	}else if (servicioid==='Auto') {
		auto(info,res)
	}


}


module.exports.sendEmail = function(req,res){

	var contacto = req.body;

	console.log("El req Body es "+ req.body );
	console.log("El codigo de area es "+contacto.codigoArea);




// send the message and get a callback with an error or details of the message that was sent
	server.send({
	   text:    "this works!!",
	   from:    "SwordVoice Support <swordvoiceoficial@gmail.com>", 
	   to:      "Cliente <motifangel@gmail.com>",//el correo de Angel por ejemplo
	   bcc:     "<jainer.calvetti@gmail.com>",
	   subject: "Datos de contácto de pontencial cliente "+ contacto.name + " " + contacto.last,
	   attachment: 
		   [
		      {data:'<html><table width="100%" height="100%" style="min-width:348px" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr height="32px"></tr> <tr align="center"> <td> <table border="0" cellspacing="0" cellpadding="0" style="padding-bottom:20px;max-width:600px;min-width:220px"> <tbody> <tr> <td> <table cellpadding="0" cellspacing="0"> <tbody> <tr> <td></td> <td> <table width="100%" border="0" cellspacing="0" cellpadding="0" style="direction:ltr;padding-bottom:7px"> <tbody> <tr> <td align="left"> <a href="https://www.facebook.com/SwordVoice/" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">SwordVoice.com</a> </td> <td align="right" style="font-family:Roboto-Light,Helvetica,Arial,sans-serif">Angel Briceño</td> <td align="right" width="35"></td></tr></tbody></table><div style="background-color:#f5f5f5;direction:ltr;padding:22px 16px;margin-bottom:6px"> <table class="m_1092153860470792112v2rsp" width="100%" border="0" cellspacing="0" cellpadding="0"> <tbody> <tr> <td style="vertical-align:top"><img height="40px" src="https://scontent-mia3-1.xx.fbcdn.net/v/t1.0-9/29101712_284307252101484_4721983321239729592_n.png?oh=df4e8fd949bcb3543998c16a40d69fdd&oe=5B46C338" class="CToWUd"> </td> <td width="16px"></td> <td style="direction:ltr"> <span style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;color:rgba(0,0,0,0.54)">Haz recibido un correo automático a, <a style="text-decoration:none;color:rgba(0,0,0,0.87)">motifangel@gmail.com</a>, en respuesta a una solicitud de contácto en tu página web <a style="text-decoration:none;color:rgba(0,0,0,0.87)" href="https://www.motifseguros.com" >www.motifseguros.com</a>.</span> <span> </span></td></tr></tbody></table></div></td><td></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/6NxNAmLKGq1e8ePcitdSiE-X-g8kwo2ATcZjIpFFPtHwgl7s6aanLDIF9dsO8K_I6mvnuTEPEOBsA1ofqn8y7FrVN0Arjzpe7m-ybWUmwNHmDkVVjLyV=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-nw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/eketyJkGVxhK6Z5kXJPMvc_xp4ewMG0-rRub0qdMfuT8kRsGDhdrztbZqOttWDJvnFldtuGk_LaoOSBBNNxxI0PtZrvXy1Kt39bkZKAr5Fs0Qt0Puw=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-n.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci5.googleusercontent.com/proxy/xXtFP3fp-NWW8Fb-jpdgVdKyl14_H1kufMnB0ms_EbTo-TtcXRkIcX0LK69J6deIRi7KtH9BXAlSZ709fcAywLyu6uHSgFLQ8kg3vVUZHZ310P_EbOIQ=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-ne.png") top right no-repeat" width="6" height="5"><div></div></td></tr><tr><td style="background:url("https://ci5.googleusercontent.com/proxy/jx-kL5P_JYf7EHBI57k0jTf0wQfWYZB9kjzqrzIUKgvE3oSR3AwtIrijgMsn2DzciTsgxv2g5Rs9DjUo3-CCepVGCikhcSsa_4WWHymP1-RbfK9Uxg=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-w.png") center left repeat-y" width="6"><div></div></td><td><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;padding-left:20px;padding-right:20px;border-bottom:thin solid #f0f0f0;color:rgba(0,0,0,0.87);font-size:24px;padding-bottom:38px;padding-top:40px;text-align:center;word-break:break-word"><div class="m_1092153860470792112v2sp">Estimado cliente, un potencial usuario/cliente de tus servicios desea ser contáctado a la brevedad. Su datos son:<br> <br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Nombre: '+contacto.name+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Apellido: '+contacto.last+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Email: '+contacto.email+'</a><br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">Teléfono: '+contacto.codigoArea+' '+contacto.phone+'</a><br><br> Y te ha dejado el siguiente comentario:<br> <a style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.87);font-size:16px;line-height:1.8">"'+contacto.comments+'"</a><br> </div></div><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;font-size:13px;color:rgba(0,0,0,0.87);line-height:1.6;padding-left:20px;padding-right:20px;padding-bottom:32px;padding-top:24px"><div class="m_1092153860470792112v2sp">RECOMENDACIÓN: Para mejorar la actividad en tu negocio, te aconsejamos atender lo más pronto posible a estás solicitudes de contácto.</div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/v4PZGPA_yWl9Ao0I9PMW-iusp_SIUwORiMYopVopB7tHHf5JrzCM8wjpZjUH8PCy1nP9bvypqYynsjnbqBKKV8fKuQyziI02mZiGELaNneCrxgcZ7g=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-e.png") center left repeat-y" width="6"><div></div></td></tr><tr><td style="background:url("https://ci4.googleusercontent.com/proxy/NmRFBb5WaOipoP4-CA_Wr23mwv5paJ8NxNkn-IFUdRudCxS35ItH90_LXh3XIbUzaYpYQ5GQCuxTn9ZNxP3TiEm4kraOE1ViKAaPcxDgFyGhLXwm7Vym=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-sw.png") top left no-repeat" width="6" height="5"><div></div></td><td style="background:url("https://ci3.googleusercontent.com/proxy/NiBXJ6NLEKMReFj7Q_woMq9t-SpwXXuP1gUMLt5ayWo38pcgPoMyntxtn7uSckxGL8db40em6KTuoVGr5EvfgiVACFYRGWsD2e8zeNZ08VEMzxdCnA=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-pixel-s.png") top center repeat-x" height="5"><div></div></td><td style="background:url("https://ci6.googleusercontent.com/proxy/Jyaq0B-T749z8QKm69foqx_50a92MjjSAeEkYA-z-7fa8yaIhCynKRmprO2-kCbtU-MBzXiYpWgX4rfuXWbD7zs0-TuMTr0MDBK7QWNhj0rX6boEmYWM=s0-d-e1-ft#https://www.gstatic.com/accountalerts/email/hodor/4-corner-se.png") top left no-repeat" width="6" height="5"><div></div></td></tr><tr><td></td><td><div style="text-align:left"><div style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px"><div>Te hemos enviado este correo electrónico como parte de tu servicio WEB en SwordVoice, para información acerca de este servicio u otros servicios disponibles contáctacnos a través del +58 416 9380074, nuestro <a href="https://www.facebook.com/SwordVoice/">Facebook</a> o a través de nuestra página <a href="https://www.facebook.com/SwordVoice/">SwordVoice.com</a></div><div style="direction:ltr">© 2017 SwordVoice LLC.,<a class="m_1092153860470792112afal" style="font-family:Roboto-Regular,Helvetica,Arial,sans-serif;color:rgba(0,0,0,0.54);font-size:12px;line-height:20px;padding-top:10px">Caracas, Venezuela</a></div></div><div style="display:none!important;max-height:0px;max-width:0px">et:31</div></div></td><td></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr height="32px"></tr></tbody></table></html>', alternative:true}
		   ]
	}, function(err, message) { 

			console.log(err || message); 


		if (err) {
			sendJSONresponse(res, 404, err);//en caso de error se envia el error
			return;
		}else {

			sendJSONresponse(res, 200, message);
		}


	});

	
		
}



/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

exports.server = __webpack_require__(20);
exports.message = __webpack_require__(8);
exports.SMTP = __webpack_require__(5);


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var smtp       = __webpack_require__(5);
var smtpError    = __webpack_require__(0);
var message      = __webpack_require__(8);
var addressparser= __webpack_require__(9);

var Client = function(server)
{
   this.smtp         = new smtp.SMTP(server);
   //this.smtp.debug(1);

   this.queue        = [];
   this.timer        = null;
   this.sending      = false;
   this.ready        = false;
};

Client.prototype = 
{
   _poll: function()
   {
      var self = this;

      clearTimeout(self.timer);

      if(self.queue.length)
      {
         if(self.smtp.state() == smtp.state.NOTCONNECTED)
            self._connect(self.queue[0]);

         else if(self.smtp.state() == smtp.state.CONNECTED && !self.sending && self.ready)
            self._sendmail(self.queue.shift());
      }
      // wait around 1 seconds in case something does come in, otherwise close out SMTP connection if still open
      else if(self.smtp.state() == smtp.state.CONNECTED)
         self.timer = setTimeout(function() { self.smtp.quit(); }, 1000);
   },

   _connect: function(stack)
   {
      var self = this,

      connect = function(err)
      {
         if(!err)
         {
            var begin = function(err)
            {
               if(!err)
               {
                  self.ready = true;
                  self._poll();
               }
               else {
                  stack.callback(err, stack.message);

                  // clear out the queue so all callbacks can be called with the same error message
                  self.queue.shift();
                  self._poll();
               }
            };

            if(!self.smtp.authorized())
               self.smtp.login(begin);

            else
               self.smtp.ehlo_or_helo_if_needed(begin);
         }
         else {
            stack.callback(err, stack.message);

            // clear out the queue so all callbacks can be called with the same error message
            self.queue.shift();
            self._poll();
         }
      };

      self.ready = false;
      self.smtp.connect(connect);
   },

   send: function(msg, callback)
   {
      var self = this;

      if(!(msg instanceof message.Message) 
          && msg.from 
          && (msg.to || msg.cc || msg.bcc)
          && (msg.text !== undefined || this._containsInlinedHtml(msg.attachment)))
         msg = message.create(msg);

      if(msg instanceof message.Message)
      {
         msg.valid(function(valid, why)
         {
            if(valid)
            {
               var stack = 
               {
                  message:    msg,
                  to:         addressparser(msg.header.to),
                  from:       addressparser(msg.header.from)[0].address,
                  callback:   callback || function() {}
               };

               if(msg.header.cc)
                  stack.to = stack.to.concat(addressparser(msg.header.cc));

               if(msg.header.bcc)
                  stack.to = stack.to.concat(addressparser(msg.header.bcc));

               if(msg.header['return-path'] && addressparser(msg.header['return-path']).length)
                 stack.returnPath = addressparser(msg.header['return-path'])[0].address;

               self.queue.push(stack);
               self._poll();
            }
            else
               callback(new Error(why), msg);
         });
      }
      else
         callback(new Error("message is not a valid Message instance"), msg);
   },

   _containsInlinedHtml: function(attachment) {
	   if (Array.isArray(attachment)) {
		   return attachment.some((function(ctx) {
			   return function(att) {
				   return ctx._isAttachmentInlinedHtml(att);
			   };
		   })(this));
	   } else {
		   return this._isAttachmentInlinedHtml(attachment);
	   }   
	},

   _isAttachmentInlinedHtml: function(attachment) {
	   return attachment && 
		  (attachment.data || attachment.path) && 
		   attachment.alternative === true;
   },

   _sendsmtp: function(stack, next)
   {
      var self   = this;
      var check= function(err)
      {
         if(!err && next)
         {
            next.apply(self, [stack]);
         }
         else
         {
            // if we snag on SMTP commands, call done, passing the error
            // but first reset SMTP state so queue can continue polling
            self.smtp.rset(function() { self._senddone(err, stack); });
         }
      };

      return check;
   },

   _sendmail: function(stack)
   {
      var self = this;
      var from = stack.returnPath || stack.from;
      self.sending = true;
      self.smtp.mail(self._sendsmtp(stack, self._sendrcpt), '<' + from + '>');
   },

   _sendrcpt: function(stack)
   {
      var self = this, to = stack.to.shift().address;
      self.smtp.rcpt(self._sendsmtp(stack, stack.to.length ? self._sendrcpt : self._senddata), '<'+ to +'>');
   },

   _senddata: function(stack)
   {
      var self = this;
      self.smtp.data(self._sendsmtp(stack, self._sendmessage));
   },

   _sendmessage: function(stack)
   {
      var self = this, stream = stack.message.stream();

      stream.on('data', function(data) { self.smtp.message(data); });
      stream.on('end', function() { self.smtp.data_end(self._sendsmtp(stack, function() { self._senddone(null, stack) })); });

      // there is no way to cancel a message while in the DATA portion, so we have to close the socket to prevent
      // a bad email from going out
      stream.on('error', function(err) { self.smtp.close(); self._senddone(err, stack); });
   },

   _senddone: function(err, stack)
   {
      var self = this;
      self.sending = false;
      stack.callback(err, stack.message);
      self._poll();
   }
};

exports.Client = Client;

exports.connect = function(server)
{
   return new Client(server);
};


/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = require("net");

/***/ }),
/* 22 */
/***/ (function(module, exports) {

module.exports = require("crypto");

/***/ }),
/* 23 */
/***/ (function(module, exports) {

module.exports = require("tls");

/***/ }),
/* 24 */
/***/ (function(module, exports) {

module.exports = require("events");

/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var SMTPError = __webpack_require__(0);

var SMTPResponse = function(stream, timeout, onerror) 
{
  var buffer = '',

  notify = function()
  {
    if(buffer.length)
    {
      // parse buffer for response codes
      var line = buffer.replace("\r", '');
        
      if(!line.trim().split(/\n/).pop().match(/^(\d{3})\s/))
          return;
        
      var match = line ? line.match(/(\d+)\s?(.*)/) : null;

      stream.emit('response', null, match ? {code:match[1], message:match[2], data:line} : {code:-1, data:line});
      buffer = '';
    }
  },

  error = function(err)
  {
    stream.emit('response', SMTPError('connection encountered an error', SMTPError.ERROR, err));
  },

  timedout = function(err)
  {
    stream.end();
    stream.emit('response', SMTPError('timedout while connecting to smtp server', SMTPError.TIMEDOUT, err));
  },

  watch = function(data)
  {
    //var data = stream.read();
    if (data !== null) {
      var decoded = data.toString();
      var emit		= false;
      var code		= 0;

      buffer += decoded;
      notify();
    }
  },

  close = function(err)
  {
    stream.emit('response', SMTPError('connection has closed', SMTPError.CONNECTIONCLOSED, err));
  },

  end = function(err)
  {
    stream.emit('response', SMTPError('connection has ended', SMTPError.CONNECTIONENDED, err));
  };

  this.stop = function(err) {
    stream.removeAllListeners('response');
    //stream.removeListener('readable', watch);
    stream.removeListener('data', watch);
    stream.removeListener('end', end);
    stream.removeListener('close', close);
    stream.removeListener('error', error);

    if(err && typeof(onerror) == "function")
      onerror(err);
  };

  //stream.on('readable', watch);
  stream.on('data', watch);
  stream.on('end', end);
  stream.on('close', close);
  stream.on('error', error);
  stream.setTimeout(timeout, timedout);
};

exports.monitor = function(stream, timeout, onerror) 
{
  return new SMTPResponse(stream, timeout, onerror);
};


/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = require("starttls");

/***/ }),
/* 27 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = require("moment");

/***/ }),
/* 29 */
/***/ (function(module, exports) {

module.exports = require("mimelib");

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = require("bufferjs/concat");

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

!function(l,n){for(var t in n)l[t]=n[t]}(exports,function(l){var n={};function t(e){if(n[e])return n[e].exports;var u=n[e]={i:e,l:!1,exports:{}};return l[e].call(u.exports,u,u.exports,t),u.l=!0,u.exports}return t.m=l,t.c=n,t.d=function(l,n,e){t.o(l,n)||Object.defineProperty(l,n,{configurable:!1,enumerable:!0,get:e})},t.n=function(l){var n=l&&l.__esModule?function(){return l.default}:function(){return l};return t.d(n,"a",n),n},t.o=function(l,n){return Object.prototype.hasOwnProperty.call(l,n)},t.p="",t(t.s=0)}({"+1Bu":function(l,n,t){"use strict";n.styles=["a[_ngcontent-%COMP%]{color:#fff;font-size:large}a[_ngcontent-%COMP%]:focus, a[_ngcontent-%COMP%]:hover{text-decoration:none;color:#fff}#actionButtons[_ngcontent-%COMP%]{position:fixed;bottom:2%;left:calc(50% - 134px)}.banners[_ngcontent-%COMP%]{display:none;height:80vh;background-repeat:no-repeat;background-size:cover;background-position:50%}#viaBanIzq[_ngcontent-%COMP%]{background-image:url(viajeBannerSmall1.jpg)}#viaBanDer[_ngcontent-%COMP%]{background-image:url(viajeBannerSmall2.jpg)}#autoBanIzq[_ngcontent-%COMP%]{background-image:url(autoBannerSmall1.jpg)}#autoBanDer[_ngcontent-%COMP%]{background-image:url(autoBannerSmall2.jpg)}#saludBanIzq[_ngcontent-%COMP%]{background-image:url(saludBannerSmall1.jpg)}#saludBanDer[_ngcontent-%COMP%]{background-image:url(saludBannerSmall2.jpg)}#patriBanIzq[_ngcontent-%COMP%]{background-image:url(patriBannerSmall1.jpg)}#patriBanDer[_ngcontent-%COMP%]{background-image:url(patriBannerSmall2.jpg)}#invBanIzq[_ngcontent-%COMP%]{background-image:url(invBannerSmall1.jpg);background-position-x:30%}#invBanDer[_ngcontent-%COMP%]{background-image:url(invBannerSmall2.jpg);background-position-x:right}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-track{display:none}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar{width:6px;background-color:#1d2735}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-thumb{border-radius:6px;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(.44,#7a99d9),color-stop(.72,#497dbd),color-stop(.86,#1c3a94))}.paragraphCont[_ngcontent-%COMP%]{padding-top:calc(50px + 2%)}.paragraphCont[_ngcontent-%COMP%]   p[_ngcontent-%COMP%], ul[_ngcontent-%COMP%]{font-family:Dosis;font-size:medium;color:#fff}.paragraphCont[_ngcontent-%COMP%]   h4[_ngcontent-%COMP%]{color:#fff;font-family:Dosis;font-size:large}.paragraphCont[_ngcontent-%COMP%]   ul[_ngcontent-%COMP%]   li[_ngcontent-%COMP%]{padding-top:2%}.btn[_ngcontent-%COMP%]:active:focus, .btn[_ngcontent-%COMP%]:focus{outline:initial!important}.btnFijo[_ngcontent-%COMP%]{border-radius:50%;webkit-box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2);box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2);position:fixed;background:#82b1ff!important;z-index:200;color:#f1f1f1}#btnAbajo[_ngcontent-%COMP%], #btnArriba[_ngcontent-%COMP%]{right:0;margin-right:5%;margin-bottom:5%;width:40px;height:40px}#btnArriba[_ngcontent-%COMP%]{bottom:50px}#btnAbajo[_ngcontent-%COMP%]{bottom:0}#contenedor[_ngcontent-%COMP%]{background:#1d2731;width:100%}.contedorT[_ngcontent-%COMP%]{height:100vh}.rellenoT[_ngcontent-%COMP%]{font-family:Playfair Display sc,sans-serif;padding-bottom:1%;text-align:center;font-size:5vh;color:#fcf8e3;position:relative;top:50%;left:50%;transform:translate(-50%,-50%);width:-webkit-fit-content;width:-moz-fit-content;width:70%;background-color:rgba(40,96,144,.6);webkit-box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2);box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2)}.paragraph[_ngcontent-%COMP%]{height:100vh}.paragraph[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{color:#fff}.scrolleable[_ngcontent-%COMP%]{overflow-y:scroll;height:80vh}.image[_ngcontent-%COMP%]{background-attachment:scroll;background-position:50%;background-repeat:no-repeat;background-size:cover;height:100vh}h2[_ngcontent-%COMP%], p[_ngcontent-%COMP%]{margin:0}#firstImg[_ngcontent-%COMP%]{background-image:url(salud-compressor.jpg)}#secImg[_ngcontent-%COMP%]{background-image:url(auto-md.jpg);background-position:50%;background-position-y:inherit}#thirdImg[_ngcontent-%COMP%]{background-image:url(patrimoniales.jpg)}#fourImg[_ngcontent-%COMP%]{background-image:url(fianzas-compressor.png)}#fifthImg[_ngcontent-%COMP%]{background-image:url(inversiones.jpg)}#sixthImg[_ngcontent-%COMP%]{background-image:url(viajes.jpg)}@media (max-width:380px){#btnAbajo[_ngcontent-%COMP%], #btnArriba[_ngcontent-%COMP%]{margin-bottom:60px}}@media (min-width:576px){.title[_ngcontent-%COMP%]{font-size:8vh}}@media (min-width:900px) and (pointer:coarse) and (orientation:landscape){.banners[_ngcontent-%COMP%]{display:block}}@media (min-width:900px){.paragraphCont[_ngcontent-%COMP%]{padding-top:calc(5vh + 50px)}.banners[_ngcontent-%COMP%]{display:block}}@media (min-width:900px) and (pointer:fine){.title[_ngcontent-%COMP%]{font-size:15vh}.image[_ngcontent-%COMP%]{background-attachment:fixed}#secImg[_ngcontent-%COMP%]{background-image:url(auto.jpg)}#btnAbajo[_ngcontent-%COMP%], #btnArriba[_ngcontent-%COMP%]{margin-right:2%;margin-bottom:2%}}"]},"+ZWX":function(l,n,t){"use strict";var e=t("Sse8"),u=t("OQ0P"),o=t("Sfk1"),i=t("rR6K"),r=t("9cLR"),a=t("BkAy"),d=t("ECCM"),s=t("wp5R"),c=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function p(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(1,0,null,null,1,"app-background",[],null,null,null,o.View_BackgroundComponent_0,o.RenderType_BackgroundComponent)),u.\u0275did(2,49152,null,0,i.BackgroundComponent,[],null,null),(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(4,0,null,null,1,"app-page-header",[],null,null,null,r.View_PageHeaderComponent_0,r.RenderType_PageHeaderComponent)),u.\u0275did(5,114688,null,0,a.PageHeaderComponent,[],null,null),(l()(),u.\u0275ted(-1,null,["\n\n"]))],function(l,n){l(n,5,0)},null)}function m(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-home",[],null,null,null,p,c)),u.\u0275did(1,114688,null,0,d.HomeComponent,[s.Title,s.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_HomeComponent=c,n.View_HomeComponent_0=p,n.View_HomeComponent_Host_0=m,n.HomeComponentNgFactory=u.\u0275ccf("app-home",d.HomeComponent,m,{},{},[])},"+y5T":function(l,n,t){"use strict";n.styles=["input[type=date][_ngcontent-%COMP%], input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}"]},0:function(l,n,t){l.exports=t("Zq8w")},"02xY":function(l,n){l.exports=__webpack_require__(32)},"1us+":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("AQ4L"),t("wp5R"),n.PriceComponent=function(){function l(l){this.metaService=l,this.intrucciones=["Escoge el servicio de tu preferencia","Rellena el formulario","Env\xeda tu informaci\xf3n","La cotizacion te estar\xe1 llegando a la brevedad posible al correo electr\xf3nico proporcionado"],this.servicios=["Viajes","Seguro de Vida","Salud","Auto","Patrimonios"]}return l.prototype.ngOnInit=function(){this.metaService.addTag({name:"description",content:"Ofrecemos el servicio de cotizaci\xf3n sin compromisos v\xeda correo electr\xf3nico, VISITANOS!!! "}),this.metaService.addTag({name:"keywords",content:"Precio de seguros,Cotizaciones de seguros, Cotizaci\xf3n en l\xednea"})},l.prototype.modalForm=function(l){console.log(l),this.modal.showModal("modalPrice")},l}()},"3VK2":function(l,n,t){"use strict";n.styles=[".modal-title[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%]{font-size:x-large}.modal-header[_ngcontent-%COMP%]{background:#2c4561;color:#f1f1f1}.modal-header[_ngcontent-%COMP%]   h5[_ngcontent-%COMP%]{font-size:x-large}"]},"3rOA":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("wp5R");var e=function(){function l(l){this.metaService=l,this.flechaAbajo=!0,this.offsetAnterior=0,this.winSize=window.innerHeight}return l.prototype.ngOnInit=function(){this.metaService.addTag({name:"description",content:"Tenemos una gran variedad de servicios y productos que se pueden adaptar a tus necesidades y las de tus familiares"}),this.metaService.addTag({name:"keywords",content:"Servicios,productos"})},l.prototype.onScrollEvent=function(l){console.log(window.pageYOffset),this.controlFlechas()},l.prototype.onResize=function(l){this.winSize=window.innerHeight,this.controlFlechas(),console.log("winSize "+this.winSize)},l.prototype.controlPaso=function(l,n,t){var e=(l-0)%t;if(e<0&&(e=0,l+=0),n)console.log("resultado es "+e),0===e?l-0<0?window.scrollTo(0,0+t):window.scrollTo(0,0+t*((l-0)/t+1)):(window.scrollTo(0,0+t*Math.ceil((l-0)/t)),console.log("(Math.ceil((puntero-OFFSET)/(winSize)))) "+Math.ceil((l-0)/t)));else{if(0===Math.floor((l-0)/t)||(l-0)/t==1)return void window.scrollTo(0,0);0===e?window.scrollTo(0,0+t*((l-0)/t-1)):window.scrollTo(0,0+t*Math.floor((l-0)/t))}},l.prototype.controlFlechas=function(){this.flechaArriba=!(window.pageYOffset<=0),this.flechaAbajo=!(window.pageYOffset>=9*window.innerHeight)},l.prototype.up=function(){this.direccion=!1,this.controlPaso(window.pageYOffset,this.direccion,this.winSize)},l.prototype.down=function(){this.direccion=!0,this.controlPaso(window.pageYOffset,this.direccion,this.winSize)},l}();n.ServicesComponent=e},"8wGh":function(l,n){l.exports=__webpack_require__(33)},"8yvP":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("Ir0Z"),u=t("p5Ee"),o=t("02xY");t("DFBs"),t("f3VV"),t("wZ9U"),t("Hc+a"),t("WK6H"),n.DefaultFormComponent=function(){function l(l,n){this.fb=l,this.http=n,this.valido=!1,this.errorSend=!1,this.successSend=!1,this.sending=!1,this.headers=new e.HttpHeaders({"Content-Type":"application/json"}),this.defaultForm=l.group({name:[null,o.Validators.compose([o.Validators.required,o.Validators.pattern("^[a-zA-Z\xf1\xd1\xe1\xe9\xed\xf3\xfa\xc1\xc9\xcd\xd3\xda]+$")])],last:[null,o.Validators.compose([o.Validators.required,o.Validators.pattern("^[a-zA-Z\xf1\xd1\xe1\xe9\xed\xf3\xfa\xc1\xc9\xcd\xd3\xda]+$")])],email:[null,o.Validators.compose([o.Validators.required,o.Validators.email])],codigoArea:[null,o.Validators.required],phone:[null,o.Validators.compose([o.Validators.required,o.Validators.minLength(7),o.Validators.pattern("^[0-9]+$")])]})}return l.prototype.ngOnInit=function(){},l.prototype.ngAfterViewChecked=function(){},l.prototype.isValid=function(l){this.valido=l,console.log("isValid "+l)},l.prototype.borrarMensajes=function(){this.errorSend=!1,this.successSend=!1,this.defaultForm.reset(),this.viaje?this.viaje.resetear():this.auto?this.auto.resetear():this.salud?this.salud.resetear():this.inversion&&this.inversion.resetear()},l.prototype.onSubmit=function(l){var n,t,e,o,i=this;this.defaultForm.reset(),"Viajes"===this.serv2Form?n=this.viaje.viajeSubmit():"Auto"===this.serv2Form?n=this.auto.autoSubmit():"Salud"===this.serv2Form?n=this.salud.saludSubmit():"Seguro de Vida"===this.serv2Form&&(this.serv2Form="Inversiones",n=this.inversion.inversionSubmit()),this.sending=!0,n?(e=JSON.stringify(l).replace("}",""),t=JSON.stringify(n).replace("{",","),o=e.concat(t)):o=JSON.stringify(l),console.log("result1 "+e+" result2 "+t),console.log("result "+o),this.http.post(u.environment.domain+"/emailServ/"+this.serv2Form,o,{headers:this.headers}).subscribe(function(l){console.log("Correo enviado exitosamente "+l),i.sending=!1,i.successSend=!0},function(l){console.log(l),i.sending=!1,i.errorSend=!0})},l}()},"9cLR":function(l,n,t){"use strict";var e=t("aaZ2"),u=t("OQ0P"),o=t("BkAy"),i=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function r(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,32,"div",[["style","position:relative; width:100%; height:100vh"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\n\n\t"])),(l()(),u.\u0275eld(2,0,null,null,28,"header",[["class","pageHeader"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \n\t\t"])),(l()(),u.\u0275eld(4,0,null,null,25,"div",[["class","container"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(6,0,null,null,1,"div",[["class","row "],["style","margin-top:55px"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(9,0,null,null,16,"div",[["class","row texto"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(11,0,null,null,1,"div",[["class"," col-xs-12 col-md-6 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(14,0,null,null,10,"div",[["class"," col-xs-12 col-md-6 "],["id","logoContainer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t"])),(l()(),u.\u0275eld(16,0,null,null,0,"img",[["id","logo"],["src","../assets/img/aboutLogo.png"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\n\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275eld(18,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(19,null,["\t\t\t\t\t\n\t\t\t\t\t\t","\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(21,0,null,null,2,"a",[["href","/contact"]],null,null,null,null,null)),(l()(),u.\u0275eld(22,0,null,null,1,"button",[["class","btn btn-default"],["id","contacto"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cont\xe1ctanos"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t\t"])),(l()(),u.\u0275eld(27,0,null,null,1,"div",[["class","row texto"],["id","bottomWrapper"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n"])),(l()(),u.\u0275ted(-1,null,["\t\t\n"])),(l()(),u.\u0275ted(-1,null,["\n\n\n"]))],null,function(l,n){l(n,19,0,n.component.sumPresentation)})}function a(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-page-header",[],null,null,null,r,i)),u.\u0275did(1,114688,null,0,o.PageHeaderComponent,[],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_PageHeaderComponent=i,n.View_PageHeaderComponent_0=r,n.View_PageHeaderComponent_Host_0=a,n.PageHeaderComponentNgFactory=u.\u0275ccf("app-page-header",o.PageHeaderComponent,a,{},{},[])},A7Ap:function(l,n){l.exports=__webpack_require__(34)},AQ4L:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("8yvP"),n.ModalServicesComponent=function(){function l(){}return l.prototype.ngOnChanges=function(){console.log(this.servicio)},l.prototype.showModal=function(l){jQuery("#"+l).modal("show")},l.prototype.resetear=function(){this.formulario.borrarMensajes()},l}()},ASwt:function(l,n){l.exports=__webpack_require__(1)},Ag3L:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("yv0u");t("wp5R"),n.CustomersComponent=function(){function l(l,n){this.metaService=n,this.contAliados=0,this.aliadoIn=!1,this.cargaPrincipalAliado=!0,this.triggerAliados=500,this.aliado=new Array,this.contClientes=0,this.customerIn=!1,this.cargaPrincipalCliente=!0,this.triggerClientes=500,this.cliente=new Array,this.testBrowser=e.isPlatformBrowser(l)}return l.prototype.ngOnInit=function(){var l=this;this.metaService.addTag({name:"description",content:"Present\xe1mos a nuestros clientes y aliados mas  importantes. Cre\xe1mos v\xedculos para toda la vida  "}),this.metaService.addTag({name:"keywords",content:"Clientes,Aliados"}),this.testBrowser&&(setTimeout(function(){return l.animacionClientes()},this.triggerClientes),setTimeout(function(){return l.animacionAliados()},this.triggerAliados))},l.prototype.animacionClientes=function(){var l=this;this.cargaPrincipalCliente?(this.triggerClientes=6e3,setInterval(function(){return l.animacionClientes()},this.triggerClientes),this.contClientes=this.runClientes(this.contClientes),this.cargaPrincipalCliente=!1):this.contClientes=this.runClientes(this.contClientes)},l.prototype.runClientes=function(l){var n=this;return l>=2&&(l=0),this.cliente[++l]=this.customerIn=!0,setTimeout(function(){n.cliente[l]=n.customerIn=!1},5e3),l},l.prototype.animacionAliados=function(){var l=this;this.cargaPrincipalAliado?(this.triggerAliados=6e3,setInterval(function(){return l.animacionAliados()},this.triggerAliados),this.contAliados=this.runAliados(this.contAliados),this.cargaPrincipalAliado=!1):this.contAliados=this.runAliados(this.contAliados)},l.prototype.runAliados=function(l){var n=this;return l>=5&&(l=0),this.aliado[++l]=this.aliadoIn=!0,setTimeout(function(){n.aliado[l]=n.aliadoIn=!1},5e3),l},l}()},BkAy:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.PageHeaderComponent=function(){function l(){this.name="Motif Seguros",this.sumPresentation="Invierte en tu futuro"}return l.prototype.ngOnInit=function(){},l}()},C53G:function(l,n,t){"use strict";var e=t("tylh"),u=t("OQ0P"),o=t("02xY"),i=t("yv0u"),r=t("WK6H"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                Este campo es obligatorio, recuerde que solo debe ingresar n\xfameros y sin espacios.          \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275eld(1,0,null,null,47,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0;return"submit"===n&&(e=!1!==u.\u0275nov(l,3).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,3).onReset()&&e),e},null,null)),u.\u0275did(2,16384,null,0,o.\u0275bf,[],null,null),u.\u0275did(3,540672,null,0,o.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},null),u.\u0275prd(2048,null,o.ControlContainer,null,[o.FormGroupDirective]),u.\u0275did(5,16384,null,0,o.NgControlStatusGroup,[o.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n\n\t"])),(l()(),u.\u0275eld(7,0,null,null,1,"label",[["for","edad"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Edad"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(10,0,null,null,7,"input",[["formControlName","edad"],["id","edad"],["placeholder","Edad del asegurado.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,11)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,11).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,11)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,11)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(11,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(12,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(15,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(17,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(20,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n       "])),(l()(),u.\u0275eld(22,0,null,null,25,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        \t"])),(l()(),u.\u0275eld(24,0,null,null,1,"label",[["for","tipofumador"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Fumador"])),(l()(),u.\u0275eld(26,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(28,0,null,null,6,"input",[["formControlName","tipofumador"],["name","tipofumador"],["type","radio"],["value","No Fuma"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,29)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,29).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,29)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,29)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,30).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,30).onTouched()&&e),e},null,null)),u.\u0275did(29,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(30,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(32,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(34,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" No fumador "])),(l()(),u.\u0275eld(36,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(38,0,null,null,6,"input",[["formControlName","tipofumador"],["name","tipofumador"],["type","radio"],["value","Fumador"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,39)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,39).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,39)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,39)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,40).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,40).onTouched()&&e),e},null,null)),u.\u0275did(39,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(40,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(42,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(44,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" Fumador "])),(l()(),u.\u0275eld(46,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["        \t\n        "])),(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,3,0,t.inversionForm),l(n,12,0,""),l(n,15,0,"edad"),l(n,20,0,t.inversionForm.controls.edad.invalid&&t.inversionForm.controls.edad.dirty&&t.inversionForm.controls.edad.touched),l(n,30,0,"tipofumador","tipofumador","No Fuma"),l(n,32,0,"tipofumador"),l(n,40,0,"tipofumador","tipofumador","Fumador"),l(n,42,0,"tipofumador")},function(l,n){l(n,1,0,u.\u0275nov(n,5).ngClassUntouched,u.\u0275nov(n,5).ngClassTouched,u.\u0275nov(n,5).ngClassPristine,u.\u0275nov(n,5).ngClassDirty,u.\u0275nov(n,5).ngClassValid,u.\u0275nov(n,5).ngClassInvalid,u.\u0275nov(n,5).ngClassPending),l(n,10,0,u.\u0275nov(n,12).required?"":null,u.\u0275nov(n,17).ngClassUntouched,u.\u0275nov(n,17).ngClassTouched,u.\u0275nov(n,17).ngClassPristine,u.\u0275nov(n,17).ngClassDirty,u.\u0275nov(n,17).ngClassValid,u.\u0275nov(n,17).ngClassInvalid,u.\u0275nov(n,17).ngClassPending),l(n,28,0,u.\u0275nov(n,34).ngClassUntouched,u.\u0275nov(n,34).ngClassTouched,u.\u0275nov(n,34).ngClassPristine,u.\u0275nov(n,34).ngClassDirty,u.\u0275nov(n,34).ngClassValid,u.\u0275nov(n,34).ngClassInvalid,u.\u0275nov(n,34).ngClassPending),l(n,38,0,u.\u0275nov(n,44).ngClassUntouched,u.\u0275nov(n,44).ngClassTouched,u.\u0275nov(n,44).ngClassPristine,u.\u0275nov(n,44).ngClassDirty,u.\u0275nov(n,44).ngClassValid,u.\u0275nov(n,44).ngClassInvalid,u.\u0275nov(n,44).ngClassPending)})}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-inversiones-form",[],null,null,null,s,a)),u.\u0275did(1,8437760,null,0,r.InversionesFormComponent,[o.FormBuilder],null,null)],null,null)}n.RenderType_InversionesFormComponent=a,n.View_InversionesFormComponent_0=s,n.View_InversionesFormComponent_Host_0=c,n.InversionesFormComponentNgFactory=u.\u0275ccf("app-inversiones-form",r.InversionesFormComponent,c,{},{inversionEventValid:"inversionEventValid"},[])},CaZB:function(l,n,t){"use strict";n.styles=["input[type=date][_ngcontent-%COMP%], input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}"]},DFBs:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("OQ0P"),u=t("02xY");n.ViajeFormComponent=function(){function l(l){this.fb=l,this.viajeEventValid=new e.EventEmitter,this.inhibidor=!1,this.viajeForm=l.group({edad:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[0-9]+$")])],fechaIda:[null,u.Validators.compose([u.Validators.required])],fechaVuelta:[null],tipoViaje:[null,u.Validators.required]})}return l.prototype.viajeSubmit=function(){var l=this.viajeForm.value;return this.resetear(),l},l.prototype.resetear=function(){this.viajeForm.reset()},l.prototype.validador=function(){return"ida"===this.viajeForm.value.tipoViaje?(this.viajeForm.value.fechaVuelta="No aplica, el viaje es solo ida",!!this.viajeForm.valid):!(!this.viajeForm.value.fechaVuelta||!this.viajeForm.valid)},l.prototype.ngAfterViewChecked=function(){this.validador()&&!this.inhibidor&&(this.viajeEventValid.emit(!0),this.inhibidor=!0),this.inhibidor&&!this.validador()&&(this.inhibidor=!1,this.viajeEventValid.emit(!1))},l}()},DU9H:function(l,n,t){"use strict";var e=t("+y5T"),u=t("OQ0P"),o=t("02xY"),i=t("yv0u"),r=t("wZ9U"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio.          \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "]))],null,null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,21,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0;return"submit"===n&&(e=!1!==u.\u0275nov(l,2).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,2).onReset()&&e),e},null,null)),u.\u0275did(1,16384,null,0,o.\u0275bf,[],null,null),u.\u0275did(2,540672,null,0,o.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},null),u.\u0275prd(2048,null,o.ControlContainer,null,[o.FormGroupDirective]),u.\u0275did(4,16384,null,0,o.NgControlStatusGroup,[o.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\n\n\n        "])),(l()(),u.\u0275eld(6,0,null,null,1,"label",[["for","fecha"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Fecha de Nacimiento"])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275eld(9,0,null,null,7,"input",[["formControlName","fecha"],["id","fecha"],["placeholder","Fecha de Nacimiento.."],["required",""],["type","date"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,10)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,10).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,10)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,10)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(10,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(11,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(14,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(16,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(19,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n    \n\n \n\n      \n\n\n\n\n\n\n\n\n        "])),(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,2,0,t.saludForm),l(n,11,0,""),l(n,14,0,"fecha"),l(n,19,0,t.saludForm.controls.fecha.invalid&&t.saludForm.controls.fecha.dirty&&t.saludForm.controls.fecha.touched)},function(l,n){l(n,0,0,u.\u0275nov(n,4).ngClassUntouched,u.\u0275nov(n,4).ngClassTouched,u.\u0275nov(n,4).ngClassPristine,u.\u0275nov(n,4).ngClassDirty,u.\u0275nov(n,4).ngClassValid,u.\u0275nov(n,4).ngClassInvalid,u.\u0275nov(n,4).ngClassPending),l(n,9,0,u.\u0275nov(n,11).required?"":null,u.\u0275nov(n,16).ngClassUntouched,u.\u0275nov(n,16).ngClassTouched,u.\u0275nov(n,16).ngClassPristine,u.\u0275nov(n,16).ngClassDirty,u.\u0275nov(n,16).ngClassValid,u.\u0275nov(n,16).ngClassInvalid,u.\u0275nov(n,16).ngClassPending)})}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-salud-form",[],null,null,null,s,a)),u.\u0275did(1,8437760,null,0,r.SaludFormComponent,[o.FormBuilder],null,null)],null,null)}n.RenderType_SaludFormComponent=a,n.View_SaludFormComponent_0=s,n.View_SaludFormComponent_Host_0=c,n.SaludFormComponentNgFactory=u.\u0275ccf("app-salud-form",r.SaludFormComponent,c,{},{saludEventValid:"saludEventValid"},[])},ECCM:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("wp5R"),n.HomeComponent=function(){function l(l,n){this.titleService=l,this.metaService=n}return l.prototype.ngOnInit=function(){this.metaService.addTag({name:"description",content:"La mejor soluci\xf3n en seguros internacionales y nacionales en Venezuela. Ofrecemos excelentes planes de inversi\xf3n adaptados a tus necesidades"}),this.metaService.addTag({name:"keywords",content:"Inversiones, Seguros, P\xf3lizas, Protecci\xf3n, Viajes, Bienestar, Salud, Automovil, Polizas, Polizas de viaje, Polizas de seguros, Polizas de vida, Seguro Internacional , Segurs internacionales, Seguros en d\xf3lares, Seguros en dolares, Seguro Internacional en Venezuela, Seguro Internacional en Caracas, Seguros de Viaje, Seguros de autos, Seguros de carro, Seguros en Venezuela , Atrio Seguros, Seguros de vida, Aseguradora, Aseguradoras"})},l}()},G8hW:function(l,n,t){"use strict";n.styles=["#imagen[_ngcontent-%COMP%]{background-image:url(clientes.jpg);background-size:cover;background-position-y:bottom;height:60vh}#titulo[_ngcontent-%COMP%]{font-family:Playfair display sc,sans-serif;font-size:5vh}.contenedorAnim[_ngcontent-%COMP%]{position:absolute}.contenedorAnim[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-family:Dosis,Arimo,sans-serif}.show[_ngcontent-%COMP%]{opacity:1;transition:.5s}.fadeInLeft[_ngcontent-%COMP%]{animation-name:fadeInLeft;animation-duration:1s;animation-fill-mode:both}@keyframes fadeInLeft{0%{opacity:0;z-index:1;transform:translate3d(-100%,0,0)}to{z-index:2;opacity:1;transform:none}}.fadeOutRight[_ngcontent-%COMP%]{animation-name:fadeOutRight;animation-duration:1s;animation-fill-mode:both}@keyframes fadeOutRight{0%{z-index:2;opacity:1}to{z-index:1;opacity:0;transform:translateZ(0)}}@media (orientation:landscape){.contenedorPadre[_ngcontent-%COMP%]{height:100vh}}@media (orientation:portrait){.contenedorPadre[_ngcontent-%COMP%]{height:50vh}}"]},"Hc+a":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("OQ0P");n.PatrimonioFormComponent=function(){function l(){this.patriEventValid=new e.EventEmitter}return l.prototype.ngOnInit=function(){this.patriEventValid.emit(!0)},l}()},"Hq/i":function(l,n){l.exports=__webpack_require__(35)},Hw6k:function(l,n,t){"use strict";n.styles=["#back[_ngcontent-%COMP%], #front[_ngcontent-%COMP%]{width:100%}#back[_ngcontent-%COMP%]{height:100%;position:absolute;-o-object-fit:cover;object-fit:cover;-webkit-filter:blur(3px);filter:blur(3px)}@media(orientation:landscape){#hello[_ngcontent-%COMP%]{background-image:url(/assets/img/hola.png);background-size:cover;background-repeat:no-repeat;position:fixed;width:100%;height:100vh;left:0;bottom:0}}@media(orientation:landscape) and (min-width:900px) and (pointer:fine){#hello[_ngcontent-%COMP%]{width:85%}}@media(orientation:portrait){#hello[_ngcontent-%COMP%]{background-image:url(/assets/img/hola.png);background-size:cover;background-repeat:no-repeat;position:fixed;width:120%;height:100vh;right:0;bottom:0}}"]},Ir0Z:function(l,n){l.exports=__webpack_require__(36)},JD3r:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ModalComponent=function(){function l(){}return Object.defineProperty(l.prototype,"_modalTitle",{set:function(l){this.modalTitle=l},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"_modalId",{set:function(l){this.modalId=l},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"_modalBody",{set:function(l){this.modalBody=l},enumerable:!0,configurable:!0}),l.prototype.showModal=function(l){jQuery("#"+l).modal("show")},l.prototype.ngOnInit=function(){},l}()},JwoV:function(l,n,t){"use strict";var e=t("OQ0P"),u=t("bNRb"),o=t("wQAS"),i=t("+ZWX"),r=t("UF2k"),a=t("Now4"),d=t("LUa/"),s=t("NSUN"),c=t("LUvk"),p=t("gou4"),m=t("yv0u"),g=t("wp5R"),v=t("ASwt"),f=t("8wGh"),C=t("Hq/i"),h=t("Ir0Z"),b=t("f9NF"),_=t("l0JX"),O=t("02xY"),y=t("A7Ap"),R=t("ECCM"),S=t("t4+y"),V=t("egH5"),P=t("Ag3L"),N=t("3rOA"),A=t("1us+"),M=t("aR8+");n.AppServerModuleNgFactory=e.\u0275cmf(u.AppServerModule,[o.AppComponent],function(l){return e.\u0275mod([e.\u0275mpd(512,e.ComponentFactoryResolver,e.\u0275CodegenComponentFactoryResolver,[[8,[i.HomeComponentNgFactory,r.AboutComponentNgFactory,a.ContactComponentNgFactory,d.CustomersComponentNgFactory,s.ServicesComponentNgFactory,c.PriceComponentNgFactory,p.AppComponentNgFactory]],[3,e.ComponentFactoryResolver],e.NgModuleRef]),e.\u0275mpd(5120,e.LOCALE_ID,e.\u0275q,[[3,e.LOCALE_ID]]),e.\u0275mpd(4608,m.NgLocalization,m.NgLocaleLocalization,[e.LOCALE_ID,[2,m.\u0275a]]),e.\u0275mpd(5120,e.IterableDiffers,e.\u0275n,[]),e.\u0275mpd(5120,e.KeyValueDiffers,e.\u0275o,[]),e.\u0275mpd(4608,g.DomSanitizer,g.\u0275e,[m.DOCUMENT]),e.\u0275mpd(6144,e.Sanitizer,null,[g.DomSanitizer]),e.\u0275mpd(4608,g.HAMMER_GESTURE_CONFIG,g.HammerGestureConfig,[]),e.\u0275mpd(5120,g.EVENT_MANAGER_PLUGINS,function(l,n,t,e,u){return[new g.\u0275DomEventsPlugin(l,n),new g.\u0275KeyEventsPlugin(t),new g.\u0275HammerGesturesPlugin(e,u)]},[m.DOCUMENT,e.NgZone,m.DOCUMENT,m.DOCUMENT,g.HAMMER_GESTURE_CONFIG]),e.\u0275mpd(4608,g.EventManager,g.EventManager,[g.EVENT_MANAGER_PLUGINS,e.NgZone]),e.\u0275mpd(135680,g.\u0275DomSharedStylesHost,g.\u0275DomSharedStylesHost,[m.DOCUMENT]),e.\u0275mpd(4608,g.\u0275DomRendererFactory2,g.\u0275DomRendererFactory2,[g.EventManager,g.\u0275DomSharedStylesHost]),e.\u0275mpd(4608,v.\u0275c,v.\u0275c,[g.DOCUMENT,[2,g.\u0275TRANSITION_ID]]),e.\u0275mpd(6144,g.\u0275SharedStylesHost,null,[v.\u0275c]),e.\u0275mpd(4608,v.\u0275ServerRendererFactory2,v.\u0275ServerRendererFactory2,[e.NgZone,g.DOCUMENT,g.\u0275SharedStylesHost]),e.\u0275mpd(4608,f.AnimationDriver,f.\u0275NoopAnimationDriver,[]),e.\u0275mpd(5120,f.\u0275AnimationStyleNormalizer,C.\u0275d,[]),e.\u0275mpd(4608,f.\u0275AnimationEngine,C.\u0275b,[f.AnimationDriver,f.\u0275AnimationStyleNormalizer]),e.\u0275mpd(5120,e.RendererFactory2,v.\u0275a,[v.\u0275ServerRendererFactory2,f.\u0275AnimationEngine,e.NgZone]),e.\u0275mpd(4352,e.Testability,null,[]),e.\u0275mpd(4608,g.Meta,g.Meta,[m.DOCUMENT]),e.\u0275mpd(4608,g.Title,g.Title,[m.DOCUMENT]),e.\u0275mpd(4608,h.HttpXsrfTokenExtractor,h.\u0275h,[m.DOCUMENT,e.PLATFORM_ID,h.\u0275f]),e.\u0275mpd(4608,h.\u0275i,h.\u0275i,[h.HttpXsrfTokenExtractor,h.\u0275g]),e.\u0275mpd(5120,h.HTTP_INTERCEPTORS,function(l){return[l]},[h.\u0275i]),e.\u0275mpd(4608,h.XhrFactory,v.\u0275d,[]),e.\u0275mpd(4608,h.HttpXhrBackend,h.HttpXhrBackend,[h.XhrFactory]),e.\u0275mpd(6144,h.HttpBackend,null,[h.HttpXhrBackend]),e.\u0275mpd(5120,h.HttpHandler,v.\u0275g,[h.HttpBackend,[2,h.HTTP_INTERCEPTORS]]),e.\u0275mpd(4608,h.HttpClient,h.HttpClient,[h.HttpHandler]),e.\u0275mpd(4608,h.\u0275e,h.\u0275e,[]),e.\u0275mpd(4608,b.BrowserXhr,v.\u0275d,[]),e.\u0275mpd(4608,b.ResponseOptions,b.BaseResponseOptions,[]),e.\u0275mpd(4608,b.XSRFStrategy,v.\u0275e,[]),e.\u0275mpd(4608,b.XHRBackend,b.XHRBackend,[b.BrowserXhr,b.ResponseOptions,b.XSRFStrategy]),e.\u0275mpd(4608,b.RequestOptions,b.BaseRequestOptions,[]),e.\u0275mpd(5120,b.Http,v.\u0275f,[b.XHRBackend,b.RequestOptions]),e.\u0275mpd(4608,_.AnimationBuilder,C.\u0275BrowserAnimationBuilder,[e.RendererFactory2,g.DOCUMENT]),e.\u0275mpd(4608,g.TransferState,g.TransferState,[]),e.\u0275mpd(4608,O.FormBuilder,O.FormBuilder,[]),e.\u0275mpd(4608,O.\u0275i,O.\u0275i,[]),e.\u0275mpd(5120,y.ActivatedRoute,y.\u0275f,[y.Router]),e.\u0275mpd(4608,y.NoPreloading,y.NoPreloading,[]),e.\u0275mpd(6144,y.PreloadingStrategy,null,[y.NoPreloading]),e.\u0275mpd(135680,y.RouterPreloader,y.RouterPreloader,[y.Router,e.NgModuleFactoryLoader,e.Compiler,e.Injector,y.PreloadingStrategy]),e.\u0275mpd(4608,y.PreloadAllModules,y.PreloadAllModules,[]),e.\u0275mpd(5120,y.ROUTER_INITIALIZER,y.\u0275i,[y.\u0275g]),e.\u0275mpd(5120,e.APP_BOOTSTRAP_LISTENER,function(l){return[l]},[y.ROUTER_INITIALIZER]),e.\u0275mpd(5120,v.BEFORE_APP_SERIALIZED,function(l,n,t){return[v.\u0275b(l,n,t)]},[g.DOCUMENT,e.APP_ID,g.TransferState]),e.\u0275mpd(512,m.CommonModule,m.CommonModule,[]),e.\u0275mpd(1024,e.ErrorHandler,g.\u0275a,[]),e.\u0275mpd(1024,e.NgProbeToken,function(){return[y.\u0275b()]},[]),e.\u0275mpd(256,e.APP_ID,"universal-demo-v5",[]),e.\u0275mpd(2048,g.\u0275TRANSITION_ID,null,[e.APP_ID]),e.\u0275mpd(512,y.\u0275g,y.\u0275g,[e.Injector]),e.\u0275mpd(1024,e.APP_INITIALIZER,function(l,n,t,e,u){return[g.\u0275h(l),g.\u0275f(n,t,e),y.\u0275h(u)]},[[2,e.NgProbeToken],g.\u0275TRANSITION_ID,m.DOCUMENT,e.Injector,y.\u0275g]),e.\u0275mpd(512,e.ApplicationInitStatus,e.ApplicationInitStatus,[[2,e.APP_INITIALIZER]]),e.\u0275mpd(131584,e.ApplicationRef,e.ApplicationRef,[e.NgZone,e.\u0275Console,e.Injector,e.ErrorHandler,e.ComponentFactoryResolver,e.ApplicationInitStatus]),e.\u0275mpd(512,e.ApplicationModule,e.ApplicationModule,[e.ApplicationRef]),e.\u0275mpd(512,g.BrowserModule,g.BrowserModule,[[3,g.BrowserModule]]),e.\u0275mpd(512,h.HttpClientXsrfModule,h.HttpClientXsrfModule,[]),e.\u0275mpd(512,h.HttpClientModule,h.HttpClientModule,[]),e.\u0275mpd(512,b.HttpModule,b.HttpModule,[]),e.\u0275mpd(512,C.BrowserAnimationsModule,C.BrowserAnimationsModule,[]),e.\u0275mpd(512,g.BrowserTransferStateModule,g.BrowserTransferStateModule,[]),e.\u0275mpd(512,O.\u0275ba,O.\u0275ba,[]),e.\u0275mpd(512,O.ReactiveFormsModule,O.ReactiveFormsModule,[]),e.\u0275mpd(512,O.FormsModule,O.FormsModule,[]),e.\u0275mpd(1024,y.\u0275a,y.\u0275d,[[3,y.Router]]),e.\u0275mpd(512,y.UrlSerializer,y.DefaultUrlSerializer,[]),e.\u0275mpd(512,y.ChildrenOutletContexts,y.ChildrenOutletContexts,[]),e.\u0275mpd(256,y.ROUTER_CONFIGURATION,{},[]),e.\u0275mpd(1024,m.LocationStrategy,y.\u0275c,[m.PlatformLocation,[2,m.APP_BASE_HREF],y.ROUTER_CONFIGURATION]),e.\u0275mpd(512,m.Location,m.Location,[m.LocationStrategy]),e.\u0275mpd(512,e.Compiler,e.Compiler,[]),e.\u0275mpd(512,e.NgModuleFactoryLoader,e.SystemJsNgModuleLoader,[e.Compiler,[2,e.SystemJsNgModuleLoaderConfig]]),e.\u0275mpd(1024,y.ROUTES,function(){return[[{path:"home",component:R.HomeComponent},{path:"about",component:S.AboutComponent},{path:"contact",component:V.ContactComponent},{path:"customers",component:P.CustomersComponent},{path:"services",component:N.ServicesComponent},{path:"price",component:A.PriceComponent},{path:"**",redirectTo:"/home",pathMatch:"full"}]]},[]),e.\u0275mpd(1024,y.Router,y.\u0275e,[e.ApplicationRef,y.UrlSerializer,y.ChildrenOutletContexts,m.Location,e.Injector,e.NgModuleFactoryLoader,e.Compiler,y.ROUTES,y.ROUTER_CONFIGURATION,[2,y.UrlHandlingStrategy],[2,y.RouteReuseStrategy]]),e.\u0275mpd(512,y.RouterModule,y.RouterModule,[[2,y.\u0275a],[2,y.Router]]),e.\u0275mpd(512,M.AppModule,M.AppModule,[]),e.\u0275mpd(512,C.NoopAnimationsModule,C.NoopAnimationsModule,[]),e.\u0275mpd(512,v.ServerModule,v.ServerModule,[]),e.\u0275mpd(512,v.ServerTransferStateModule,v.ServerTransferStateModule,[]),e.\u0275mpd(512,u.AppServerModule,u.AppServerModule,[]),e.\u0275mpd(256,h.\u0275f,"XSRF-TOKEN",[]),e.\u0275mpd(256,h.\u0275g,"X-XSRF-TOKEN",[])])})},KCzB:function(l,n,t){"use strict";var e=t("OHMb"),u=t("OQ0P"),o=t("RVTK"),i=t("8yvP"),r=t("02xY"),a=t("Ir0Z"),d=t("AQ4L"),s=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function c(l){return u.\u0275vid(0,[u.\u0275qud(402653184,1,{formulario:0}),(l()(),u.\u0275eld(1,0,null,null,31,"div",[["class","modal"],["data-backdrop","static"],["data-keyboard","false"],["id","modalPrice"],["role","dialog"],["tabindex","-1"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n  "])),(l()(),u.\u0275eld(3,0,null,null,28,"div",[["class","modal-dialog"],["role","document"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275eld(5,0,null,null,25,"div",[["class","modal-content"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275eld(7,0,null,null,10,"div",[["class","modal-header"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(9,0,null,null,4,"button",[["class","close"],["data-dismiss","modal"],["type","button"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.resetear()&&e),e},null,null)),(l()(),u.\u0275eld(10,0,null,null,1,"span",[["aria-hidden","true"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\xd7"])),(l()(),u.\u0275eld(12,0,null,null,1,"span",[["class","sr-only"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Close"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(15,0,null,null,1,"h2",[["class","modal-title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Solicitud de Cotizaci\xf3n"])),(l()(),u.\u0275ted(-1,null,["\n        \n      "])),(l()(),u.\u0275ted(-1,null,["\n\n      "])),(l()(),u.\u0275eld(19,0,null,null,4,"div",[["class","modal-body"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(21,0,null,null,1,"app-default-form",[],null,null,null,o.View_DefaultFormComponent_0,o.RenderType_DefaultFormComponent)),u.\u0275did(22,8503296,[[1,4],["formulario",4]],0,i.DefaultFormComponent,[r.FormBuilder,a.HttpClient],{serv2Form:[0,"serv2Form"]},null),(l()(),u.\u0275ted(-1,null,[" \n\n  \t\t\t\n      "])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275eld(25,0,null,null,4,"div",[["class","modal-footer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(27,0,null,null,1,"button",[["class","btn btn-danger"],["data-dismiss","modal"],["type","button"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.resetear()&&e),e},null,null)),(l()(),u.\u0275ted(-1,null,["Cancelar"])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275ted(-1,null,["\n  "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){l(n,22,0,n.component.servicio)},null)}function p(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-modal-services",[],null,null,null,c,s)),u.\u0275did(1,573440,null,0,d.ModalServicesComponent,[],null,null)],null,null)}n.RenderType_ModalServicesComponent=s,n.View_ModalServicesComponent_0=c,n.View_ModalServicesComponent_Host_0=p,n.ModalServicesComponentNgFactory=u.\u0275ccf("app-modal-services",d.ModalServicesComponent,p,{servicio:"servicio"},{},[])},KFPU:function(l,n,t){"use strict";var e=t("3VK2"),u=t("OQ0P"),o=t("JD3r"),i=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function r(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,25,"div",[["class","modal"],["role","dialog"],["tabindex","-1"]],[[8,"id",0]],null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n  "])),(l()(),u.\u0275eld(2,0,null,null,22,"div",[["class","modal-dialog"],["role","document"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275eld(4,0,null,null,19,"div",[["class","modal-content"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275eld(6,0,null,null,4,"div",[["class","modal-header"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(8,0,null,null,1,"h5",[["class","modal-title"]],null,null,null,null,null)),(l()(),u.\u0275ted(9,null,["",""])),(l()(),u.\u0275ted(-1,null,["\n        \n      "])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275eld(12,0,null,null,4,"div",[["class","modal-body"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(14,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(15,null,["","\n        "])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275eld(18,0,null,null,4,"div",[["class","modal-footer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(20,0,null,null,1,"button",[["class","btn btn-primary"],["data-dismiss","modal"],["type","button"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cerrar"])),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275ted(-1,null,["\n  "])),(l()(),u.\u0275ted(-1,null,["\n"]))],null,function(l,n){var t=n.component;l(n,0,0,t.modalId),l(n,9,0,t.modalTitle),l(n,15,0,t.modalBody)})}function a(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-modal",[],null,null,null,r,i)),u.\u0275did(1,114688,null,0,o.ModalComponent,[],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_ModalComponent=i,n.View_ModalComponent_0=r,n.View_ModalComponent_Host_0=a,n.ModalComponentNgFactory=u.\u0275ccf("app-modal",o.ModalComponent,a,{},{},[])},"LUa/":function(l,n,t){"use strict";var e=t("G8hW"),u=t("OQ0P"),o=t("yv0u"),i=t("Ag3L"),r=t("wp5R"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["\t"])),(l()(),u.\u0275eld(1,0,null,null,189,"div",[["class","container"],["style","margin-top:50px "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t"])),(l()(),u.\u0275eld(3,0,null,null,15,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(5,0,null,null,12,"div",[["class","col-xs-12"],["id","imagen"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(7,0,null,null,9,"div",[["style","   \n\t\t\t\t\t\t\t    position: absolute;\n\t\t\t\t\t\t\t    color: white;\n\t\t\t\t\t\t\t    display: table-cell;\n\t\t\t\t\t\t\t    vertical-align: middle;\n\t\t\t\t\t\t\t    bottom: 5%;\n\t\t\t\t\t\t\t    right: 2%;\n\t\t\t\t\t\t\t    background: rgba(0, 0, 0, 0.5);"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(9,0,null,null,3,"h2",[["style","    \n\t\t\t\t\t\t\t\tfont-style: italic;\n\t\t\t\t\t\t\t\tfont-size:xx-large;\n\t\t\t\t\t\t\t"]],null,null,null,null,null)),(l()(),u.\u0275eld(10,0,null,null,1,"q",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Un cliente satisfecho es la mejor estrategia de negocio"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\t\t\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(14,0,null,null,1,"h4",[["style","text-align:right;font-size:x-large;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Michael LeBoeuf"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t"])),(l()(),u.\u0275eld(20,0,null,null,7,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(22,0,null,null,4,"div",[["class","col-xs-12"],["id","titulo"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(24,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestros Clientes"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t"])),(l()(),u.\u0275eld(29,0,null,null,44,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(31,0,null,null,41,"div",[["class","contenedorPadre"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(33,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(34,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275eld(36,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(38,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Caracas Air"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(42,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(44,0,null,null,1,"a",[["href","http://www.caracasair.com.ve/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(45,0,null,null,0,"img",[["alt","www.caracasair.com.ve"],["src","../../assets/img/caracasAir.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(47,0,null,null,2,"a",[["href","http://www.caracasair.com.ve/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(48,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(53,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(54,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(56,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(58,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["CompraloTodo"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(62,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(64,0,null,null,1,"a",[["href","http://compralotodo24.com/tienda1/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(65,0,null,null,0,"img",[["alt","compralotodo24.com"],["src","../../assets/img/compralotodo.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(67,0,null,null,2,"a",[["href","http://compralotodo24.com/tienda1/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(68,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t"])),(l()(),u.\u0275eld(75,0,null,null,7,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(77,0,null,null,4,"div",[["class","col-xs-12"],["id","titulo"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(79,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestros Aliados"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t"])),(l()(),u.\u0275eld(84,0,null,null,105,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(86,0,null,null,101,"div",[["class","contenedorPadre"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(88,0,null,null,18,"div",[["class","contenedorAnim "]],null,null,null,null,null)),u.\u0275did(89,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(91,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(93,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["PA Group"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(97,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(99,0,null,null,1,"a",[["href","https://www.pagroupco.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(100,0,null,null,0,"img",[["alt","www.pagroupco.com"],["src","../../assets/img/paGroup.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(102,0,null,null,2,"a",[["href","https://www.pagroupco.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(103,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(108,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(109,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(111,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(113,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Facebank"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(117,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(119,0,null,null,1,"a",[["href","https://www.facebank.pr/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(120,0,null,null,0,"img",[["alt","www.facebank.pr"],["src","../../assets/img/facebank.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(122,0,null,null,2,"a",[["href","https://www.facebank.pr/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(123,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t"])),(l()(),u.\u0275eld(128,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(129,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(131,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(133,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Atrio Travel Assist"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(137,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(139,0,null,null,1,"a",[["href","https://www.atriotravelassist.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(140,0,null,null,0,"img",[["alt","www.atriotravelassist.com"],["src","../../assets/img/atrio.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(142,0,null,null,2,"a",[["href","https://www.atriotravelassist.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(143,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(148,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(149,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(151,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(153,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["BMI Seguros"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(157,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(159,0,null,null,1,"a",[["href","https://www.bmicos.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(160,0,null,null,0,"img",[["alt","www.bmicos.com/"],["src","../../assets/img/bmi.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(162,0,null,null,2,"a",[["href","https://www.bmicos.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(163,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t"])),(l()(),u.\u0275eld(168,0,null,null,18,"div",[["class","contenedorAnim"]],null,null,null,null,null)),u.\u0275did(169,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(171,0,null,null,4,"div",[["class","col-xs-12 col-lg-2"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(173,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Investors Trust"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(177,0,null,null,8,"div",[["class","col-xs-12 col-lg-10"],["style","text-align:center"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(179,0,null,null,1,"a",[["href","https://www.investors-trust.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(180,0,null,null,0,"img",[["alt","www.investors-trust.com"],["src","../../assets/img/invest.jpg"],["style","width:80%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(182,0,null,null,2,"a",[["href","https://www.investors-trust.com/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(183,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Click sobre la imagen para saber m\xe1s"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n\n\n\t\t\n\t"])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,34,0,"contenedorAnim",t.cliente[1]?"fadeInLeft":"fadeOutRight"),l(n,54,0,"contenedorAnim",t.cliente[2]?"fadeInLeft":"fadeOutRight"),l(n,89,0,"contenedorAnim ",t.aliado[1]?"fadeInLeft":"fadeOutRight"),l(n,109,0,"contenedorAnim",t.aliado[2]?"fadeInLeft":"fadeOutRight"),l(n,129,0,"contenedorAnim",t.aliado[3]?"fadeInLeft":"fadeOutRight"),l(n,149,0,"contenedorAnim",t.aliado[4]?"fadeInLeft":"fadeOutRight"),l(n,169,0,"contenedorAnim",t.aliado[5]?"fadeInLeft":"fadeOutRight")},null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-customers",[],null,null,null,d,a)),u.\u0275did(1,114688,null,0,i.CustomersComponent,[u.PLATFORM_ID,r.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_CustomersComponent=a,n.View_CustomersComponent_0=d,n.View_CustomersComponent_Host_0=s,n.CustomersComponentNgFactory=u.\u0275ccf("app-customers",i.CustomersComponent,s,{},{},[])},LUvk:function(l,n,t){"use strict";var e=t("jBio"),u=t("OQ0P"),o=t("02xY"),i=t("KCzB"),r=t("AQ4L"),a=t("yv0u"),d=t("1us+"),s=t("wp5R"),c=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function p(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(1,147456,null,0,o.NgSelectOption,[u.ElementRef,u.Renderer2,[2,o.SelectControlValueAccessor]],null,null),u.\u0275did(2,147456,null,0,o.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(3,null,["",""]))],null,function(l,n){l(n,3,0,n.context.$implicit)})}function m(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"button",[["class","btn btn-default"],["disabled",""],["style"," margin-left: 10px;"]],null,null,null,null,null)),(l()(),u.\u0275ted(1,null,["\n\t\t\t\tCotiza ","\n\t\t\t"]))],null,function(l,n){l(n,1,0,n.component.selectedService)})}function g(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"button",[["class","btn btn-success"],["style"," margin-left: 10px;"]],null,[[null,"click"]],function(l,n,t){var e=!0,u=l.component;return"click"===n&&(e=!1!==u.modalForm(u.selectedService)&&e),e},null,null)),(l()(),u.\u0275ted(1,null,["\n\t\t\t\tCotiza ","\n\t\t\t"]))],null,function(l,n){l(n,1,0,n.component.selectedService)})}function v(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(2,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(3,null,["",""])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"]))],null,function(l,n){l(n,3,0,n.context.$implicit)})}function f(l){return u.\u0275vid(0,[u.\u0275qud(402653184,1,{modal:0}),(l()(),u.\u0275eld(1,0,null,null,1,"app-modal-services",[],null,null,null,i.View_ModalServicesComponent_0,i.RenderType_ModalServicesComponent)),u.\u0275did(2,573440,[[1,4],["modal",4]],0,r.ModalServicesComponent,[],{servicio:[0,"servicio"]},null),(l()(),u.\u0275ted(-1,null,["\n\n"])),(l()(),u.\u0275eld(4,0,null,null,71,"div",[["style"," display:table; width:100%;  background: #1d2731;    color: #f1f1f1; "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t"])),(l()(),u.\u0275eld(6,0,null,null,30,"div",[["class","container"],["id","headerImg"],["style","margin-top:50px; padding-bottom:2%;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(8,0,null,null,1,"div",[["style","height: 25vh"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275eld(11,0,null,null,24,"div",[["class","row"],["style","height: 30vh"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(13,0,null,null,1,"div",[["class","col-sm-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(16,0,null,null,15,"div",[["class","col-sm-8 col-xs-12"],["style"," min-height:30vh;  \n\t\t\t\t\tbackground: rgba(95, 158, 160, 0.47);\n\t\t\t\t\t webkit-box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2);\n    box-shadow: 0 2px 2px 0 rgba(0,0,0,0.14), 0 1px 5px 0 rgba(0,0,0,0.12), 0 3px 1px -2px rgba(0,0,0,0.2); display:table;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(18,0,null,null,12,"div",[["style","   \n\t\t\t\t\t\tdisplay: table-cell;\n    \t\t\t\t\tvertical-align: middle;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(20,0,null,null,3,"h2",[["style","    \n\t\t\t\t\t\t\tfont-style: italic;\n\t\t\t\t\t\t\tfont-size:xx-large;\n\t\t\t\t\t\t"]],null,null,null,null,null)),(l()(),u.\u0275eld(21,0,null,null,1,"q",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["La calidad se recuerda mucho despu\xe9s de haber olvidado el precio"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(25,0,null,null,1,"h4",[["style","text-align:right;font-size:x-large;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Frederich Henry Royce"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(28,0,null,null,1,"h5",[["style","text-align:right;font-size:large;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" Cofundador de Rolls-Royce "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(33,0,null,null,1,"div",[["class","col-sm-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\n\n\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\n\n\n\t\t"])),(l()(),u.\u0275eld(38,0,null,null,36,"div",[["class"," col-xs-12"],["style","    min-height: calc(40vh - 50px)"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(40,0,null,null,1,"h1",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Bienvenido a nuestra secci\xf3n de solicitud de cotizaci\xf3n"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275eld(43,0,null,null,15,"div",[["style"," display: initial;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(45,0,null,null,1,"h3",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Seleccione su opci\xf3n a continuaci\xf3n: "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(48,0,null,null,9,"select",[["style","color: #010101;\n\t\t\t    min-width: 20vh;\n\t\t\t    font-size: medium;\n\t\t\t    height: 30px;\n\t\t\t    border-style: hidden;"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngModelChange"],[null,"change"],[null,"blur"]],function(l,n,t){var e=!0,o=l.component;return"change"===n&&(e=!1!==u.\u0275nov(l,49).onChange(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,49).onTouched()&&e),"ngModelChange"===n&&(e=!1!==(o.selectedService=t)&&e),e},null,null)),u.\u0275did(49,16384,null,0,o.SelectControlValueAccessor,[u.Renderer2,u.ElementRef],null,null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.SelectControlValueAccessor]),u.\u0275did(51,671744,null,0,o.NgModel,[[8,null],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{model:[0,"model"]},{update:"ngModelChange"}),u.\u0275prd(2048,null,o.NgControl,null,[o.NgModel]),u.\u0275did(53,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,p)),u.\u0275did(56,802816,null,0,a.NgForOf,[u.ViewContainerRef,u.TemplateRef,u.IterableDiffers],{ngForOf:[0,"ngForOf"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["  \n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t\t\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,m)),u.\u0275did(61,16384,null,0,a.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,g)),u.\u0275did(64,16384,null,0,a.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275eld(66,0,null,null,1,"h3",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Intrucciones:"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,v)),u.\u0275did(70,802816,null,0,a.NgForOf,[u.ViewContainerRef,u.TemplateRef,u.IterableDiffers],{ngForOf:[0,"ngForOf"]},null),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(72,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["NOTA: Usted no est\xe1 adquiriendo ning\xfan compromiso de compra, solo est\xe1 solicitando un presupuesto."])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\n\n\t\t\t\n\n\n\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n\n\t\n\n"]))],function(l,n){var t=n.component;l(n,2,0,t.selectedService),l(n,51,0,t.selectedService),l(n,56,0,t.servicios),l(n,61,0,!t.selectedService),l(n,64,0,t.selectedService),l(n,70,0,t.intrucciones)},function(l,n){l(n,48,0,u.\u0275nov(n,53).ngClassUntouched,u.\u0275nov(n,53).ngClassTouched,u.\u0275nov(n,53).ngClassPristine,u.\u0275nov(n,53).ngClassDirty,u.\u0275nov(n,53).ngClassValid,u.\u0275nov(n,53).ngClassInvalid,u.\u0275nov(n,53).ngClassPending)})}function C(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-price",[],null,null,null,f,c)),u.\u0275did(1,114688,null,0,d.PriceComponent,[s.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_PriceComponent=c,n.View_PriceComponent_0=f,n.View_PriceComponent_Host_0=C,n.PriceComponentNgFactory=u.\u0275ccf("app-price",d.PriceComponent,C,{},{},[])},NSUN:function(l,n,t){"use strict";var e=t("+1Bu"),u=t("OQ0P"),o=t("yv0u"),i=t("3rOA"),r=t("wp5R"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"button",[["class","btn btnFijo"],["id","btnArriba"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.up()&&e),e},null,null)),(l()(),u.\u0275eld(1,0,null,null,0,"i",[["aria-hidden","true"],["class","fa fa-arrow-up"]],null,null,null,null,null))],null,null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"button",[["class","btn btnFijo"],["id","btnAbajo"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.down()&&e),e},null,null)),(l()(),u.\u0275eld(1,0,null,null,0,"i",[["aria-hidden","true"],["class","fa fa-arrow-down"]],null,null,null,null,null))],null,null)}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,331,"div",[["id","contenedor"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\n\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(3,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275and(16777216,null,null,1,null,s)),u.\u0275did(6,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t"])),(l()(),u.\u0275eld(8,0,null,null,10,"div",[["class","image"],["id","sixthImg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275eld(10,0,null,null,7,"div",[["class","contedorT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275eld(12,0,null,null,4,"div",[["class","rellenoT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t"])),(l()(),u.\u0275eld(14,0,null,null,1,"h2",[["class","title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["VIAJES"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t"])),(l()(),u.\u0275eld(20,0,null,null,60,"div",[["class","paragraph"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(22,0,null,null,57,"div",[["class"," paragraphCont"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(24,0,null,null,1,"div",[["class","col-md-2  banners"],["id","viaBanIzq"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(27,0,null,null,48,"div",[["class","col-md-8 col-xs-12 scrolleable style-7"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(29,0,null,null,1,"h4",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["VIAJES"])),(l()(),u.\u0275eld(31,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(33,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["La p\xf3liza de asistencia en viajes te ofrece cobertura en d\xf3lares o en euros dependiendo la exigencia del pa\xeds de destino, y te permite disfrutar de la aventura de viajar sin dejar cumplir con los requisitos que exijen los convenios internacionales."])),(l()(),u.\u0275ted(-1,null,["\t"])),(l()(),u.\u0275eld(36,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  "])),(l()(),u.\u0275eld(38,0,null,null,4,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \tTener un seguro de viaje es indispensable!"])),(l()(),u.\u0275eld(40,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275eld(41,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tDurante un viaje pueden surgir emergencias m\xe9dicas que implican atenci\xf3n y prestaciones muy costosas. As\xed como tambi\xe9n la posibilidad que cancelen tu vuelo, que tu equipaje se extrav\xede o sea robado entre otras eventualidades."])),(l()(),u.\u0275ted(-1,null,["\t"])),(l()(),u.\u0275eld(44,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(46,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Un Seguro de Viaje puede ofrecerte la protecci\xf3n que necesitas a la hora de resolver cualquier emergencia y viajar m\xe1s tranquilo y seguro a un monto m\xe1s accesible de lo que imaginas, no dejes que los imprevistos te tomen por sorpresa. Por eso te ofrecemos:"])),(l()(),u.\u0275ted(-1,null,["\t\t\n\n\t\t\t\t"])),(l()(),u.\u0275eld(49,0,null,null,25,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(51,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tAsistencia m\xe9dica por accidentes\n\t\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(54,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tAsistencia m\xe9dica por enfermedad no preexistente\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(57,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tMedicamentos recetados incluidos\n\t\t\t\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(60,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tEmergencia dental\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(63,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tGastos de hotel por convalecencia\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(66,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tGastos por vuelo demorado o cancelado\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(69,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tGastos por demora en la devoluci\xf3n del equipaje \n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(72,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tCompensaci\xf3n complementaria por p\xe9rdida de equipaje \n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t  \n\n\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(77,0,null,null,1,"div",[["class","col-md-2  banners"],["id","viaBanDer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n \n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t"])),(l()(),u.\u0275eld(82,0,null,null,10,"div",[["class","image"],["id","firstImg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275eld(84,0,null,null,7,"div",[["class","contedorT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275eld(86,0,null,null,4,"div",[["class","rellenoT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t"])),(l()(),u.\u0275eld(88,0,null,null,1,"h2",[["class","title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["SALUD"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275eld(94,0,null,null,53,"div",[["class","paragraph"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(96,0,null,null,50,"div",[["class"," paragraphCont"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(98,0,null,null,1,"div",[["class","col-md-2  banners"],["id","saludBanIzq"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(101,0,null,null,41,"div",[["class","col-md-8 col-xs-12 scrolleable style-7"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(103,0,null,null,1,"h4",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["SALUD"])),(l()(),u.\u0275eld(105,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  "])),(l()(),u.\u0275eld(107,0,null,null,4,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Con la p\xf3liza de salud te puedes sentir sin preocupaci\xf3n donde quiera que est\xe9s, por su excelente cobertura y una amplia red de proveedores a nivel "])),(l()(),u.\u0275eld(109,0,null,null,1,"strong",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["MUNDIAL"])),(l()(),u.\u0275ted(-1,null,["; ofreciendote atenci\xf3n las 24 horas del d\xeda, los 7 d\xedas de la semana, los 365 d\xedas del a\xf1o."])),(l()(),u.\u0275eld(112,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\t\n\n\n\n\t\t\t\t"])),(l()(),u.\u0275eld(114,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Algunos de los beneficios incluidos en nuestros planes de salud son los siguientes:"])),(l()(),u.\u0275ted(-1,null,["\t"])),(l()(),u.\u0275eld(117,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(119,0,null,null,22,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(121,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t Plazos de espera tan solo de 30 d\xedas.\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t"])),(l()(),u.\u0275eld(124,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tExoneraci\xf3n del pago de deducible para Venezuela.\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(127,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tBeneficios de maternidad incluyendo a hijos dependientes.\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(130,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tEnv\xedo de reclamos y seguimiento del progreso de los mismos en l\xednea.\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(133,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tExtracci\xf3n de las muelas del juicio.\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t"])),(l()(),u.\u0275eld(136,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tPrimas exoneradas por dos a\xf1os para dependientes sobrevivientes.\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(139,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\tRepatriaci\xf3n de restos mortales o cobertura del entierro local en lugar de la repatriaci\xf3n.\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t\t\t\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(144,0,null,null,1,"div",[["class","col-md-2  banners"],["id","saludBanDer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n \n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t"])),(l()(),u.\u0275eld(149,0,null,null,10,"div",[["class","image"],["id","fifthImg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275eld(151,0,null,null,7,"div",[["class","contedorT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275eld(153,0,null,null,4,"div",[["class","rellenoT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t"])),(l()(),u.\u0275eld(155,0,null,null,1,"h2",[["class","title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["SEGURO DE VIDA"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t"])),(l()(),u.\u0275eld(161,0,null,null,32,"div",[["class","paragraph"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(163,0,null,null,29,"div",[["class"," paragraphCont"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(165,0,null,null,1,"div",[["class","col-md-2  banners"],["id","invBanIzq"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(168,0,null,null,20,"div",[["class","col-md-8 col-xs-12  style-7 scrolleable"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(170,0,null,null,1,"h4",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["VIDA UNIVERSAL"])),(l()(),u.\u0275eld(172,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(174,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Un seguro de vida le brinda el respaldo para proteger financieramente a sus seres queridos,\n\t\t\t\t\tsu patrimonio y sus compromisos de pago ante una potencial incapacidad personal,\n\t\t\t\t\tuna p\xe9rdida patrimonial o en caso de fallecimiento"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(177,0,null,null,10,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(179,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestros productos de vida universal, son de alta calidad a nivel mundial, con el fin de satisfacer a nuestros clientes de seguridad financiera en segmentos bien definidos."])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(182,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["La anualidades indexadas fijas tienen un inter\xe9s que est\xe1 vinculado en parte al crecimiento en el mercado de acciones, medido por un indice como el S & P 500"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(185,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Sujeto a garant\xedas m\xednimas fijas, el valor de una anualidad indexada fija, n\xfanca disminuir\xe1 debido solo al movimiento del indice."])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\t\t\n\n\t\t\t\t\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(190,0,null,null,1,"div",[["class","col-md-2  banners"],["id","invBanDer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n \n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t"])),(l()(),u.\u0275eld(195,0,null,null,10,"div",[["class","image"],["id","secImg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275eld(197,0,null,null,7,"div",[["class","contedorT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275eld(199,0,null,null,4,"div",[["class","rellenoT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t"])),(l()(),u.\u0275eld(201,0,null,null,1,"h2",[["class","title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["AUTO"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275ted(-1,null,["\t\n\t  "])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275eld(207,0,null,null,46,"div",[["class","paragraph"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(209,0,null,null,43,"div",[["class"," paragraphCont"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(211,0,null,null,1,"div",[["class","col-md-2  banners"],["id","autoBanIzq"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(214,0,null,null,34,"div",[["class","col-md-8 col-xs-12 scrolleable style-7"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(216,0,null,null,1,"h4",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["AUTO"])),(l()(),u.\u0275eld(218,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  "])),(l()(),u.\u0275eld(220,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestra novedosa p\xf3liza de autom\xf3vil est\xe1 dise\xf1ada especialmente para ti. Con productos que se adaptan a tu medida y que te permiten escoger las coberturas de acuerdo a tus posibilidades econ\xf3micas y necesidades."])),(l()(),u.\u0275eld(222,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t   \n\t\t\t  "])),(l()(),u.\u0275eld(224,0,null,null,19,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t"])),(l()(),u.\u0275eld(226,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t\tResponsabilidad Civil de veh\xedculos\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t"])),(l()(),u.\u0275eld(229,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\tServicio de gr\xfaas\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t"])),(l()(),u.\u0275eld(232,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t  \t\tVidrios 2 eventos por a\xf1o\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t"])),(l()(),u.\u0275eld(235,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t\tPerdida total\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t  \t"])),(l()(),u.\u0275eld(238,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\tDa\xf1os parciales\n\t\t\t  \t\t\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t"])),(l()(),u.\u0275eld(241,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t\tCobertura amplia\n\t\t\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t  \t\n\t\t\t  "])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t  "])),(l()(),u.\u0275eld(245,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t  \t\n\t\t\t  "])),(l()(),u.\u0275eld(247,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\t\n\n\t\t\t  \n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(250,0,null,null,1,"div",[["class","col-md-2  banners"],["id","autoBanDer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n \n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t"])),(l()(),u.\u0275eld(255,0,null,null,10,"div",[["class","image"],["id","thirdImg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275eld(257,0,null,null,7,"div",[["class","contedorT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275eld(259,0,null,null,4,"div",[["class","rellenoT"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t"])),(l()(),u.\u0275eld(261,0,null,null,1,"h2",[["class","title"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["PATRIMONIO"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t"])),(l()(),u.\u0275ted(-1,null,["\n\t  "])),(l()(),u.\u0275ted(-1,null,["\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t"])),(l()(),u.\u0275eld(267,0,null,null,51,"div",[["class","paragraph"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(269,0,null,null,48,"div",[["class"," paragraphCont"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(271,0,null,null,1,"div",[["class","col-md-2 banners"],["id","patriBanIzq"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(274,0,null,null,39,"div",[["class","col-md-8 col-xs-12 scrolleable style-7 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(276,0,null,null,1,"h4",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["PATRIMONIO"])),(l()(),u.\u0275eld(278,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(280,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Pensando en la Protecci\xf3n de tu patrimonio hemos dise\xf1ados productos para que puedas asegurar lo m\xe1s valioso para ti; desde el hogar, empresa y hasta todos los bienes que poseas."])),(l()(),u.\u0275eld(282,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(284,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["A continuaci\xf3n te presentamos algunos de los bienes y servicios asegurables:"])),(l()(),u.\u0275eld(286,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275eld(288,0,null,null,22,"ul",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(290,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tHogar\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(293,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tIndustria y comercio\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(296,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tEmbarcaciones\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(299,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tAeronaves\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(302,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tEquipos m\xe9dicos\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(305,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tMercanc\xeda en tr\xe1nsito\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(308,0,null,null,1,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\tFianzas\n\t\t\t\t\t\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(312,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(315,0,null,null,1,"div",[["class","col-md-2 banners"],["id","patriBanDer"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n \n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t"])),(l()(),u.\u0275eld(320,0,null,null,10,"div",[["id","actionButtons"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(322,0,null,null,3,"button",[["class","btn btn-danger"]],null,null,null,null,null)),(l()(),u.\u0275eld(323,0,null,null,1,"a",[["href","/contact"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cont\xe1ctanos"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(327,0,null,null,2,"button",[["class","btn btn-danger"],["style","margin-left: 10px"]],null,null,null,null,null)),(l()(),u.\u0275eld(328,0,null,null,1,"a",[["href","/price"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Presupuesto"])),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n"]))],function(l,n){var t=n.component;l(n,3,0,t.flechaArriba),l(n,6,0,t.flechaAbajo)},null)}function p(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-services",[],null,[["window","scroll"],["window","resize"]],function(l,n,t){var e=!0;return"window:scroll"===n&&(e=!1!==u.\u0275nov(l,1).onScrollEvent(t)&&e),"window:resize"===n&&(e=!1!==u.\u0275nov(l,1).onResize(t)&&e),e},c,a)),u.\u0275did(1,114688,null,0,i.ServicesComponent,[r.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_ServicesComponent=a,n.View_ServicesComponent_0=c,n.View_ServicesComponent_Host_0=p,n.ServicesComponentNgFactory=u.\u0275ccf("app-services",i.ServicesComponent,p,{},{},[])},Now4:function(l,n,t){"use strict";var e=t("XRh5"),u=t("OQ0P"),o=t("yv0u"),i=t("KFPU"),r=t("JD3r"),a=t("02xY"),d=t("egH5"),s=t("Ir0Z"),c=t("wp5R"),p=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function m(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Este campo es obligatorio, debe contener su nombre sin espacios\n\n        "]))],null,null)}function g(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Este campo es obligatorio, debe contener su apellido sin espacios\n        "]))],null,null)}function v(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                No es un correo electr\xf3nico v\xe1lido\n\n               \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function f(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Debe seleccionar un codigo de area\n        "]))],null,null)}function C(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                No es un tel\xe9fono v\xe1lido, debe contener solo n\xfameros\n\n               \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function h(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,8,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            \n            "])),(l()(),u.\u0275eld(2,0,null,null,5,"button",[["class","btn"],["type","submit"]],[[8,"disabled",0]],null,null,null,null)),u.\u0275did(3,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),u.\u0275pod(4,{"btn-primary":0}),(l()(),u.\u0275eld(5,0,null,null,1,"span",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Enviar"])),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275ted(-1,null,["\n\n        "]))],function(l,n){l(n,3,0,"btn",l(n,4,0,n.component.contactForm.valid))},function(l,n){l(n,2,0,!n.component.contactForm.valid)})}function b(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Enviando..."])),(l()(),u.\u0275eld(2,0,null,null,0,"img",[["id","loadingImg"],["src","../assets/img/Loading_icon.gif"],["style","height: 10%; width: 10%"]],null,null,null,null,null))],null,null)}function _(l){return u.\u0275vid(0,[u.\u0275qud(402653184,1,{modalSuccess:0}),u.\u0275qud(402653184,2,{modalError:0}),(l()(),u.\u0275eld(2,0,null,null,1,"app-modal",[],null,null,null,i.View_ModalComponent_0,i.RenderType_ModalComponent)),u.\u0275did(3,114688,[[2,4],["modalError",4]],0,r.ModalComponent,[],null,null),(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(5,0,null,null,1,"app-modal",[],null,null,null,i.View_ModalComponent_0,i.RenderType_ModalComponent)),u.\u0275did(6,114688,[[1,4],["modalSuccess",4]],0,r.ModalComponent,[],null,null),(l()(),u.\u0275ted(-1,null,["\n\n"])),(l()(),u.\u0275eld(8,0,null,null,152,"div",[["class","container"],["id","contacto"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275eld(10,0,null,null,149,"div",[["class","container"],["id","form"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    \t"])),(l()(),u.\u0275eld(12,0,null,null,1,"h3",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cont\xe1ctanos"])),(l()(),u.\u0275ted(-1,null,["\n\n    \t"])),(l()(),u.\u0275eld(15,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    \t\tGracias por tu inter\xe9s. Por favor, Llena este breve formulario para enviarnos comentarios o dudas acerca de nuestros servicios y te estaremos respondiendo a la mayor brevedad.\n\n    \t"])),(l()(),u.\u0275ted(-1,null,["\n\n    "])),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275eld(19,0,null,null,139,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngSubmit"],[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0,o=l.component;return"submit"===n&&(e=!1!==u.\u0275nov(l,21).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,21).onReset()&&e),"ngSubmit"===n&&(e=!1!==o.onSubmit(o.contactForm.value)&&e),e},null,null)),u.\u0275did(20,16384,null,0,a.\u0275bf,[],null,null),u.\u0275did(21,540672,null,0,a.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},{ngSubmit:"ngSubmit"}),u.\u0275prd(2048,null,a.ControlContainer,null,[a.FormGroupDirective]),u.\u0275did(23,16384,null,0,a.NgControlStatusGroup,[a.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(25,0,null,null,1,"label",[["for","name"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nombre"])),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275eld(28,0,null,null,7,"input",[["formControlName","name"],["id","name"],["placeholder","Su Nombre.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,29)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,29).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,29)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,29)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(29,16384,null,0,a.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,a.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(30,16384,null,0,a.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,a.NG_VALIDATORS,function(l){return[l]},[a.RequiredValidator]),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.DefaultValueAccessor]),u.\u0275did(33,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[2,a.NG_VALIDATORS],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(35,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,m)),u.\u0275did(38,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,[" \n\n       \n\n        "])),(l()(),u.\u0275eld(40,0,null,null,1,"label",[["for","last"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Apellido"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(43,0,null,null,7,"input",[["formControlName","last"],["id","last"],["placeholder","Su apellido.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,44)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,44).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,44)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,44)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(44,16384,null,0,a.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,a.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(45,16384,null,0,a.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,a.NG_VALIDATORS,function(l){return[l]},[a.RequiredValidator]),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.DefaultValueAccessor]),u.\u0275did(48,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[2,a.NG_VALIDATORS],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(50,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,g)),u.\u0275did(53,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n       \n\n        "])),(l()(),u.\u0275eld(55,0,null,null,1,"label",[["for","email"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Email"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(58,0,null,null,7,"input",[["formControlName","email"],["id","email"],["placeholder","Correo Electr\xf3nico.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,59)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,59).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,59)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,59)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(59,16384,null,0,a.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,a.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(60,16384,null,0,a.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,a.NG_VALIDATORS,function(l){return[l]},[a.RequiredValidator]),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.DefaultValueAccessor]),u.\u0275did(63,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[2,a.NG_VALIDATORS],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(65,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,v)),u.\u0275did(68,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        \n\n        "])),(l()(),u.\u0275eld(70,0,null,null,1,"label",[["for","phone"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Tel\xe9fono"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(73,0,null,null,61,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(75,0,null,null,46,"div",[["class","col-xs-12 col-sm-4 col-md-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(77,0,null,null,43,"select",[["formControlName","codigoArea"],["required",""]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"change"],[null,"blur"]],function(l,n,t){var e=!0;return"change"===n&&(e=!1!==u.\u0275nov(l,78).onChange(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,78).onTouched()&&e),e},null,null)),u.\u0275did(78,16384,null,0,a.SelectControlValueAccessor,[u.Renderer2,u.ElementRef],null,null),u.\u0275did(79,16384,null,0,a.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,a.NG_VALIDATORS,function(l){return[l]},[a.RequiredValidator]),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.SelectControlValueAccessor]),u.\u0275did(82,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[2,a.NG_VALIDATORS],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(84,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(86,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(87,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(88,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0212"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(91,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(92,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(93,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0412"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(96,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(97,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(98,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0414"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(101,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(102,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(103,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0416"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(106,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(107,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(108,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0424"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(111,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(112,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(113,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0426"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(116,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(117,147456,null,0,a.NgSelectOption,[u.ElementRef,u.Renderer2,[2,a.SelectControlValueAccessor]],null,null),u.\u0275did(118,147456,null,0,a.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["otro"])),(l()(),u.\u0275ted(-1,null,["\n\n                "])),(l()(),u.\u0275ted(-1,null,["                \n            "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(123,0,null,null,10,"div",[["class","col-xs-12 col-sm-8 col-md-10"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(125,0,null,null,7,"input",[["formControlName","phone"],["id","phone"],["placeholder","Su N\xfamero Telef\xf3nico.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,126)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,126).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,126)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,126)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(126,16384,null,0,a.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,a.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(127,16384,null,0,a.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,a.NG_VALIDATORS,function(l){return[l]},[a.RequiredValidator]),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.DefaultValueAccessor]),u.\u0275did(130,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[2,a.NG_VALIDATORS],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(132,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n          "])),(l()(),u.\u0275and(16777216,null,null,1,null,f)),u.\u0275did(137,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,C)),u.\u0275did(140,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n          \n\n        "])),(l()(),u.\u0275eld(142,0,null,null,1,"label",[["for","comments"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Comentarios"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(145,0,null,null,5,"textarea",[["formControlName","comments"],["id","comments"],["placeholder","Sus comentarios..."],["style","height:100px"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,146)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,146).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,146)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,146)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(146,16384,null,0,a.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,a.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275prd(1024,null,a.NG_VALUE_ACCESSOR,function(l){return[l]},[a.DefaultValueAccessor]),u.\u0275did(148,671744,null,0,a.FormControlName,[[3,a.ControlContainer],[8,null],[8,null],[2,a.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,a.NgControl,null,[a.FormControlName]),u.\u0275did(150,16384,null,0,a.NgControlStatus,[a.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\n\n        "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,h)),u.\u0275did(154,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,b)),u.\u0275did(157,16384,null,0,o.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,[" \n    "])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n\n\n"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n"])),(l()(),u.\u0275ted(-1,null,["\n\n"]))],function(l,n){var t=n.component;l(n,3,0),l(n,6,0),l(n,21,0,t.contactForm),l(n,30,0,""),l(n,33,0,"name"),l(n,38,0,!t.contactForm.controls.name.valid&&t.contactForm.controls.name.dirty&&t.contactForm.controls.name.touched),l(n,45,0,""),l(n,48,0,"last"),l(n,53,0,t.contactForm.controls.last.invalid&&t.contactForm.controls.last.dirty&&t.contactForm.controls.last.touched),l(n,60,0,""),l(n,63,0,"email"),l(n,68,0,t.contactForm.controls.email.invalid&&t.contactForm.controls.email.dirty&&t.contactForm.controls.email.touched),l(n,79,0,""),l(n,82,0,"codigoArea"),l(n,127,0,""),l(n,130,0,"phone"),l(n,137,0,t.contactForm.controls.codigoArea.invalid&&t.contactForm.controls.codigoArea.dirty&&t.contactForm.controls.codigoArea.touched),l(n,140,0,t.contactForm.controls.phone.invalid&&t.contactForm.controls.phone.dirty&&t.contactForm.controls.phone.touched),l(n,148,0,"comments"),l(n,154,0,!t.sending),l(n,157,0,t.sending)},function(l,n){l(n,19,0,u.\u0275nov(n,23).ngClassUntouched,u.\u0275nov(n,23).ngClassTouched,u.\u0275nov(n,23).ngClassPristine,u.\u0275nov(n,23).ngClassDirty,u.\u0275nov(n,23).ngClassValid,u.\u0275nov(n,23).ngClassInvalid,u.\u0275nov(n,23).ngClassPending),l(n,28,0,u.\u0275nov(n,30).required?"":null,u.\u0275nov(n,35).ngClassUntouched,u.\u0275nov(n,35).ngClassTouched,u.\u0275nov(n,35).ngClassPristine,u.\u0275nov(n,35).ngClassDirty,u.\u0275nov(n,35).ngClassValid,u.\u0275nov(n,35).ngClassInvalid,u.\u0275nov(n,35).ngClassPending),l(n,43,0,u.\u0275nov(n,45).required?"":null,u.\u0275nov(n,50).ngClassUntouched,u.\u0275nov(n,50).ngClassTouched,u.\u0275nov(n,50).ngClassPristine,u.\u0275nov(n,50).ngClassDirty,u.\u0275nov(n,50).ngClassValid,u.\u0275nov(n,50).ngClassInvalid,u.\u0275nov(n,50).ngClassPending),l(n,58,0,u.\u0275nov(n,60).required?"":null,u.\u0275nov(n,65).ngClassUntouched,u.\u0275nov(n,65).ngClassTouched,u.\u0275nov(n,65).ngClassPristine,u.\u0275nov(n,65).ngClassDirty,u.\u0275nov(n,65).ngClassValid,u.\u0275nov(n,65).ngClassInvalid,u.\u0275nov(n,65).ngClassPending),l(n,77,0,u.\u0275nov(n,79).required?"":null,u.\u0275nov(n,84).ngClassUntouched,u.\u0275nov(n,84).ngClassTouched,u.\u0275nov(n,84).ngClassPristine,u.\u0275nov(n,84).ngClassDirty,u.\u0275nov(n,84).ngClassValid,u.\u0275nov(n,84).ngClassInvalid,u.\u0275nov(n,84).ngClassPending),l(n,125,0,u.\u0275nov(n,127).required?"":null,u.\u0275nov(n,132).ngClassUntouched,u.\u0275nov(n,132).ngClassTouched,u.\u0275nov(n,132).ngClassPristine,u.\u0275nov(n,132).ngClassDirty,u.\u0275nov(n,132).ngClassValid,u.\u0275nov(n,132).ngClassInvalid,u.\u0275nov(n,132).ngClassPending),l(n,145,0,u.\u0275nov(n,150).ngClassUntouched,u.\u0275nov(n,150).ngClassTouched,u.\u0275nov(n,150).ngClassPristine,u.\u0275nov(n,150).ngClassDirty,u.\u0275nov(n,150).ngClassValid,u.\u0275nov(n,150).ngClassInvalid,u.\u0275nov(n,150).ngClassPending)})}function O(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-contact",[],null,null,null,_,p)),u.\u0275did(1,114688,null,0,d.ContactComponent,[s.HttpClient,a.FormBuilder,c.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_ContactComponent=p,n.View_ContactComponent_0=_,n.View_ContactComponent_Host_0=O,n.ContactComponentNgFactory=u.\u0275ccf("app-contact",d.ContactComponent,O,{},{},[])},OHMb:function(l,n,t){"use strict";n.styles=[""]},OQ0P:function(l,n){l.exports=__webpack_require__(2)},RVTK:function(l,n,t){"use strict";var e=t("aNlo"),u=t("OQ0P"),o=t("nioL"),i=t("f3VV"),r=t("02xY"),a=t("DU9H"),d=t("wZ9U"),s=t("i6RS"),c=t("DFBs"),p=t("C53G"),m=t("WK6H"),g=t("hrGf"),v=t("Hc+a"),f=t("yv0u"),C=t("8yvP"),h=t("Ir0Z"),b=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function _(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Este campo es obligatorio, debe contener su nombre SIN ESPACIOS. NOTA: Verifique espacios antes y despu\xe9s de su nombre.\n\n        "]))],null,null)}function O(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Este campo es obligatorio, debe contener su apellido SIN ESPACIOS. NOTA: Verifique espacios antes y despu\xe9s de su apellido.\n        "]))],null,null)}function y(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                No es un correo electr\xf3nico v\xe1lido\n\n               \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function R(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            Debe seleccionar un codigo de area\n        "]))],null,null)}function S(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                No es un tel\xe9fono v\xe1lido, debe contener solo n\xfameros.   \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function V(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"app-auto-form",[],null,[[null,"autoEventValid"]],function(l,n,t){var e=!0;return"autoEventValid"===n&&(e=!1!==l.component.isValid(t)&&e),e},o.View_AutoFormComponent_0,o.RenderType_AutoFormComponent)),u.\u0275did(1,8437760,[[2,4],["auto",4]],0,i.AutoFormComponent,[r.FormBuilder],null,{autoEventValid:"autoEventValid"}),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function P(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"app-salud-form",[],null,[[null,"saludEventValid"]],function(l,n,t){var e=!0;return"saludEventValid"===n&&(e=!1!==l.component.isValid(t)&&e),e},a.View_SaludFormComponent_0,a.RenderType_SaludFormComponent)),u.\u0275did(1,8437760,[[3,4],["salud",4]],0,d.SaludFormComponent,[r.FormBuilder],null,{saludEventValid:"saludEventValid"}),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function N(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"app-viaje-form",[],null,[[null,"viajeEventValid"]],function(l,n,t){var e=!0;return"viajeEventValid"===n&&(e=!1!==l.component.isValid(t)&&e),e},s.View_ViajeFormComponent_0,s.RenderType_ViajeFormComponent)),u.\u0275did(1,8437760,[[1,4],["viaje",4]],0,c.ViajeFormComponent,[r.FormBuilder],null,{viajeEventValid:"viajeEventValid"}),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function A(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"app-inversiones-form",[],null,[[null,"inversionEventValid"]],function(l,n,t){var e=!0;return"inversionEventValid"===n&&(e=!1!==l.component.isValid(t)&&e),e},p.View_InversionesFormComponent_0,p.RenderType_InversionesFormComponent)),u.\u0275did(1,8437760,[[5,4],["inversion",4]],0,m.InversionesFormComponent,[r.FormBuilder],null,{inversionEventValid:"inversionEventValid"}),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function M(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"app-patrimonio-form",[],null,[[null,"patriEventValid"]],function(l,n,t){var e=!0;return"patriEventValid"===n&&(e=!1!==l.component.isValid(t)&&e),e},g.View_PatrimonioFormComponent_0,g.RenderType_PatrimonioFormComponent)),u.\u0275did(1,114688,[[4,4],["patrimonio",4]],0,v.PatrimonioFormComponent,[],null,{patriEventValid:"patriEventValid"}),(l()(),u.\u0275ted(-1,null,["\n        "]))],function(l,n){l(n,1,0)},null)}function I(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,8,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            \n            "])),(l()(),u.\u0275eld(2,0,null,null,5,"button",[["class","btn"],["type","submit"]],[[8,"disabled",0]],null,null,null,null)),u.\u0275did(3,278528,null,0,f.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),u.\u0275pod(4,{"btn-primary":0}),(l()(),u.\u0275eld(5,0,null,null,1,"span",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Enviar"])),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275ted(-1,null,["\n\n        "]))],function(l,n){var t=n.component;l(n,3,0,"btn",l(n,4,0,t.defaultForm.valid&&t.valido))},function(l,n){var t=n.component;l(n,2,0,!(t.defaultForm.valid&&t.valido))})}function E(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,2,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Enviando..."])),(l()(),u.\u0275eld(2,0,null,null,0,"img",[["id","loadingImg"],["src","../assets/img/Loading_icon.gif"],["style","height: 10%; width: 10%"]],null,null,null,null,null))],null,null)}function w(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"],["style","margin-top:5px;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                UPS!!!   Hubo un error en el env\xedo de su informaci\xf3n, por favor intentelo m\xe1s tarde o escriba un correo a support@SwordVoice.com reportando lo suscedido.\n\n               \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function F(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-success"],["style","margin-top:5px;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                Muy Bien!! Su informaci\xf3n ha sido enviado exitosamente. Tambi\xe9n puede comunicarse a trav\xe9s del WhatsApp  0412-6994625\n\n               \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function x(l){return u.\u0275vid(0,[u.\u0275qud(671088640,1,{viaje:0}),u.\u0275qud(671088640,2,{auto:0}),u.\u0275qud(671088640,3,{salud:0}),u.\u0275qud(671088640,4,{patrimonio:0}),u.\u0275qud(671088640,5,{inversion:0}),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275eld(6,0,null,null,159,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["  \n\n    "])),(l()(),u.\u0275eld(8,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Datos del Asegurado"])),(l()(),u.\u0275ted(-1,null,["\n\n    "])),(l()(),u.\u0275eld(11,0,null,null,153,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"ngSubmit"],[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0,o=l.component;return"submit"===n&&(e=!1!==u.\u0275nov(l,13).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,13).onReset()&&e),"ngSubmit"===n&&(e=!1!==o.onSubmit(o.defaultForm.value)&&e),e},null,null)),u.\u0275did(12,16384,null,0,r.\u0275bf,[],null,null),u.\u0275did(13,540672,null,0,r.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},{ngSubmit:"ngSubmit"}),u.\u0275prd(2048,null,r.ControlContainer,null,[r.FormGroupDirective]),u.\u0275did(15,16384,null,0,r.NgControlStatusGroup,[r.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(17,0,null,null,1,"label",[["for","name"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nombre"])),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275eld(20,0,null,null,7,"input",[["formControlName","name"],["id","name"],["placeholder","Su Nombre.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,21)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,21).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,21)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,21)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(21,16384,null,0,r.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,r.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(22,16384,null,0,r.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,r.NG_VALIDATORS,function(l){return[l]},[r.RequiredValidator]),u.\u0275prd(1024,null,r.NG_VALUE_ACCESSOR,function(l){return[l]},[r.DefaultValueAccessor]),u.\u0275did(25,671744,null,0,r.FormControlName,[[3,r.ControlContainer],[2,r.NG_VALIDATORS],[8,null],[2,r.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,r.NgControl,null,[r.FormControlName]),u.\u0275did(27,16384,null,0,r.NgControlStatus,[r.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,_)),u.\u0275did(30,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,[" \n\n       \n\n        "])),(l()(),u.\u0275eld(32,0,null,null,1,"label",[["for","last"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Apellido"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(35,0,null,null,7,"input",[["formControlName","last"],["id","last"],["placeholder","Su apellido.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,36)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,36).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,36)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,36)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(36,16384,null,0,r.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,r.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(37,16384,null,0,r.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,r.NG_VALIDATORS,function(l){return[l]},[r.RequiredValidator]),u.\u0275prd(1024,null,r.NG_VALUE_ACCESSOR,function(l){return[l]},[r.DefaultValueAccessor]),u.\u0275did(40,671744,null,0,r.FormControlName,[[3,r.ControlContainer],[2,r.NG_VALIDATORS],[8,null],[2,r.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,r.NgControl,null,[r.FormControlName]),u.\u0275did(42,16384,null,0,r.NgControlStatus,[r.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,O)),u.\u0275did(45,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n       \n\n        "])),(l()(),u.\u0275eld(47,0,null,null,1,"label",[["for","email"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Email"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(50,0,null,null,7,"input",[["formControlName","email"],["id","email"],["placeholder","Correo Electr\xf3nico.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,51)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,51).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,51)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,51)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(51,16384,null,0,r.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,r.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(52,16384,null,0,r.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,r.NG_VALIDATORS,function(l){return[l]},[r.RequiredValidator]),u.\u0275prd(1024,null,r.NG_VALUE_ACCESSOR,function(l){return[l]},[r.DefaultValueAccessor]),u.\u0275did(55,671744,null,0,r.FormControlName,[[3,r.ControlContainer],[2,r.NG_VALIDATORS],[8,null],[2,r.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,r.NgControl,null,[r.FormControlName]),u.\u0275did(57,16384,null,0,r.NgControlStatus,[r.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,y)),u.\u0275did(60,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        \n\n        "])),(l()(),u.\u0275eld(62,0,null,null,67,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(64,0,null,null,49,"div",[["class","col-xs-12 col-sm-4 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(66,0,null,null,1,"label",[["for","codigoArea"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["C\xf3digo de \xc1rea"])),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(69,0,null,null,43,"select",[["formControlName","codigoArea"],["required",""]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"change"],[null,"blur"]],function(l,n,t){var e=!0;return"change"===n&&(e=!1!==u.\u0275nov(l,70).onChange(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,70).onTouched()&&e),e},null,null)),u.\u0275did(70,16384,null,0,r.SelectControlValueAccessor,[u.Renderer2,u.ElementRef],null,null),u.\u0275did(71,16384,null,0,r.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,r.NG_VALIDATORS,function(l){return[l]},[r.RequiredValidator]),u.\u0275prd(1024,null,r.NG_VALUE_ACCESSOR,function(l){return[l]},[r.SelectControlValueAccessor]),u.\u0275did(74,671744,null,0,r.FormControlName,[[3,r.ControlContainer],[2,r.NG_VALIDATORS],[8,null],[2,r.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,r.NgControl,null,[r.FormControlName]),u.\u0275did(76,16384,null,0,r.NgControlStatus,[r.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(78,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(79,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(80,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0212"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(83,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(84,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(85,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0412"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(88,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(89,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(90,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0414"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(93,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(94,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(95,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0416"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(98,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(99,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(100,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0424"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(103,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(104,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(105,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["0426"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(108,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(109,147456,null,0,r.NgSelectOption,[u.ElementRef,u.Renderer2,[2,r.SelectControlValueAccessor]],null,null),u.\u0275did(110,147456,null,0,r.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["otro"])),(l()(),u.\u0275ted(-1,null,["\n\n                "])),(l()(),u.\u0275ted(-1,null,["                \n            "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(115,0,null,null,13,"div",[["class","col-xs-12 col-sm-8 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(117,0,null,null,1,"label",[["for","phone"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Tel\xe9fono"])),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(120,0,null,null,7,"input",[["formControlName","phone"],["id","phone"],["placeholder","Su N\xfamero Telef\xf3nico.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,121)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,121).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,121)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,121)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(121,16384,null,0,r.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,r.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(122,16384,null,0,r.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,r.NG_VALIDATORS,function(l){return[l]},[r.RequiredValidator]),u.\u0275prd(1024,null,r.NG_VALUE_ACCESSOR,function(l){return[l]},[r.DefaultValueAccessor]),u.\u0275did(125,671744,null,0,r.FormControlName,[[3,r.ControlContainer],[2,r.NG_VALIDATORS],[8,null],[2,r.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,r.NgControl,null,[r.FormControlName]),u.\u0275did(127,16384,null,0,r.NgControlStatus,[r.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n          "])),(l()(),u.\u0275and(16777216,null,null,1,null,R)),u.\u0275did(132,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,S)),u.\u0275did(135,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n          \n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,V)),u.\u0275did(138,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,P)),u.\u0275did(141,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,N)),u.\u0275did(144,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,A)),u.\u0275did(147,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,M)),u.\u0275did(150,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["      \n\n  \n\n        "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,I)),u.\u0275did(154,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,E)),u.\u0275did(157,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,[" \n\n\n\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,w)),u.\u0275did(160,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n          "])),(l()(),u.\u0275and(16777216,null,null,1,null,F)),u.\u0275did(163,16384,null,0,f.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n\n\n    "])),(l()(),u.\u0275ted(-1,null,["\n "]))],function(l,n){var t=n.component;l(n,13,0,t.defaultForm),l(n,22,0,""),l(n,25,0,"name"),l(n,30,0,!t.defaultForm.controls.name.valid&&t.defaultForm.controls.name.dirty&&t.defaultForm.controls.name.touched),l(n,37,0,""),l(n,40,0,"last"),l(n,45,0,t.defaultForm.controls.last.invalid&&t.defaultForm.controls.last.dirty&&t.defaultForm.controls.last.touched),l(n,52,0,""),l(n,55,0,"email"),l(n,60,0,t.defaultForm.controls.email.invalid&&t.defaultForm.controls.email.dirty&&t.defaultForm.controls.email.touched),l(n,71,0,""),l(n,74,0,"codigoArea"),l(n,122,0,""),l(n,125,0,"phone"),l(n,132,0,t.defaultForm.controls.codigoArea.invalid&&t.defaultForm.controls.codigoArea.dirty&&t.defaultForm.controls.codigoArea.touched),l(n,135,0,t.defaultForm.controls.phone.invalid&&t.defaultForm.controls.phone.dirty&&t.defaultForm.controls.phone.touched),l(n,138,0,"Auto"===t.serv2Form),l(n,141,0,"Salud"===t.serv2Form),l(n,144,0,"Viajes"===t.serv2Form),l(n,147,0,"Seguro de Vida"===t.serv2Form),l(n,150,0,"Patrimonios"===t.serv2Form),l(n,154,0,!t.sending),l(n,157,0,t.sending),l(n,160,0,t.errorSend),l(n,163,0,t.successSend)},function(l,n){l(n,11,0,u.\u0275nov(n,15).ngClassUntouched,u.\u0275nov(n,15).ngClassTouched,u.\u0275nov(n,15).ngClassPristine,u.\u0275nov(n,15).ngClassDirty,u.\u0275nov(n,15).ngClassValid,u.\u0275nov(n,15).ngClassInvalid,u.\u0275nov(n,15).ngClassPending),l(n,20,0,u.\u0275nov(n,22).required?"":null,u.\u0275nov(n,27).ngClassUntouched,u.\u0275nov(n,27).ngClassTouched,u.\u0275nov(n,27).ngClassPristine,u.\u0275nov(n,27).ngClassDirty,u.\u0275nov(n,27).ngClassValid,u.\u0275nov(n,27).ngClassInvalid,u.\u0275nov(n,27).ngClassPending),l(n,35,0,u.\u0275nov(n,37).required?"":null,u.\u0275nov(n,42).ngClassUntouched,u.\u0275nov(n,42).ngClassTouched,u.\u0275nov(n,42).ngClassPristine,u.\u0275nov(n,42).ngClassDirty,u.\u0275nov(n,42).ngClassValid,u.\u0275nov(n,42).ngClassInvalid,u.\u0275nov(n,42).ngClassPending),l(n,50,0,u.\u0275nov(n,52).required?"":null,u.\u0275nov(n,57).ngClassUntouched,u.\u0275nov(n,57).ngClassTouched,u.\u0275nov(n,57).ngClassPristine,u.\u0275nov(n,57).ngClassDirty,u.\u0275nov(n,57).ngClassValid,u.\u0275nov(n,57).ngClassInvalid,u.\u0275nov(n,57).ngClassPending),l(n,69,0,u.\u0275nov(n,71).required?"":null,u.\u0275nov(n,76).ngClassUntouched,u.\u0275nov(n,76).ngClassTouched,u.\u0275nov(n,76).ngClassPristine,u.\u0275nov(n,76).ngClassDirty,u.\u0275nov(n,76).ngClassValid,u.\u0275nov(n,76).ngClassInvalid,u.\u0275nov(n,76).ngClassPending),l(n,120,0,u.\u0275nov(n,122).required?"":null,u.\u0275nov(n,127).ngClassUntouched,u.\u0275nov(n,127).ngClassTouched,u.\u0275nov(n,127).ngClassPristine,u.\u0275nov(n,127).ngClassDirty,u.\u0275nov(n,127).ngClassValid,u.\u0275nov(n,127).ngClassInvalid,u.\u0275nov(n,127).ngClassPending)})}function T(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-default-form",[],null,null,null,x,b)),u.\u0275did(1,8503296,null,0,C.DefaultFormComponent,[r.FormBuilder,h.HttpClient],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_DefaultFormComponent=b,n.View_DefaultFormComponent_0=x,n.View_DefaultFormComponent_Host_0=T,n.DefaultFormComponentNgFactory=u.\u0275ccf("app-default-form",C.DefaultFormComponent,T,{serv2Form:"serv2Form"},{},[])},RYCs:function(l,n,t){"use strict";n.styles=[""]},Rhtm:function(l,n,t){"use strict";n.styles=["input[type=date][_ngcontent-%COMP%], input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}"]},SWpx:function(l,n,t){"use strict";n.styles=["#menu{background-color:#508cd2;box-shadow:0 2px 5px 0 rgba(0,0,0,.16),0 2px 10px 0 rgba(0,0,0,.12);border-color:transparent}#botonColapse:focus{background-color:initial}#botonColapse span{background-color:#fff}.activeMenu{color:#84ffff!important}#websiteName{font-size:x-large;color:#000}#websiteName a{text-decoration:none}.fuerte{color:#000;font-family:Roboto Condensed,sans-serif}.debil{color:#f1f1f1;font-family:Roboto,sans-serif;font-weight:100}#websiteLogo{padding:0}#barraPrincipal a{font-size:large;font-family:Lobster,cursive;color:#f1f1f1}@media (max-width:700px){.onScrollLetra{color:transparent!important}.onScroll{background-color:transparent!important;box-shadow:none!important}.fondoBlanco{background:#fff}}@media (min-width:700px){.activeMenu{transform:scale(1.1)}#websiteName{font-size:large}#barraPrincipal a{font-size:medium}}@media (min-width:992px){#menu{background-color:rgba(80,140,210,.7);border-color:transparent;transition:.5s}#barraPrincipal a,#websiteName{color:#eee;transition:.1s}#websiteName{font-size:x-large}a:focus{outline:none}#barraPrincipal a:hover,#websiteName:hover{transition:.1s;transform:scale(1.2)}}"]},Sfk1:function(l,n,t){"use strict";var e=t("Hw6k"),u=t("OQ0P"),o=t("rR6K"),i=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function r(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["\n\n"])),(l()(),u.\u0275eld(1,0,null,null,0,"img",[["id","back"],["src","/assets/img/city.jpg"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t"])),(l()(),u.\u0275eld(3,0,null,null,2,"div",[["class","  col-xs-8 col-md-6 "],["id","hello"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\t\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n\n"]))],null,null)}function a(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-background",[],null,null,null,r,i)),u.\u0275did(1,49152,null,0,o.BackgroundComponent,[],null,null)],null,null)}n.RenderType_BackgroundComponent=i,n.View_BackgroundComponent_0=r,n.View_BackgroundComponent_Host_0=a,n.BackgroundComponentNgFactory=u.\u0275ccf("app-background",o.BackgroundComponent,a,{},{},[])},Sse8:function(l,n,t){"use strict";n.styles=[""]},UF2k:function(l,n,t){"use strict";var e=t("WcK0"),u=t("OQ0P"),o=t("yv0u"),i=t("t4+y"),r=t("wp5R"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(1,0,null,null,95,"div",[["class","container"],["id","about"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\n\t"])),(l()(),u.\u0275eld(3,0,null,null,92,"div",[["class","row "],["id","cardHeader"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\n\t\t\n\t\t"])),(l()(),u.\u0275eld(5,0,null,null,89,"div",[["class","col-xs-12"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \n\t\t\t"])),(l()(),u.\u0275eld(7,0,null,null,4,"div",[["class","flechaContainer"],["clickeable",""]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.flip()&&e),e},null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275eld(9,0,null,null,1,"button",[["class","btn btn-danger"]],null,null,null,null,null)),(l()(),u.\u0275eld(10,0,null,null,0,"i",[["aria-hidden","true"],["class","fas fa-redo"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\t\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275eld(13,0,null,null,80,"div",[["class","flipContainer"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.flip()&&e),e},null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\n\n\n\t\t\t\t"])),(l()(),u.\u0275eld(15,0,null,null,77,"div",[["class","flipper"]],null,null,null,null,null)),u.\u0275did(16,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),u.\u0275pod(17,{rotar:0}),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t"])),(l()(),u.\u0275eld(19,0,null,null,31,"div",[["class","cardFront "]],null,null,null,null,null)),u.\u0275did(20,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),u.\u0275pod(21,{cardOnTop:0}),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(23,0,null,null,0,"div",[["id","backImage"],["style","margin-bottom:2%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(25,0,null,null,1,"div",[["class","col-xs-12 col-md-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(28,0,null,null,21,"div",[["class","col-xs-12 col-md-8 contenido style-7"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(31,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestra Misi\xf3n"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(34,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(35,null,["\n\t\t\t\t\t\t\t\t","\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(37,0,null,null,11,"div",[["style","     text-align: initial;    margin-top: 20px;    margin-left: 5%; "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(39,0,null,null,3,"button",[["class","btn btn-danger"],["style","  margin-top: 0px;    margin-right: 5%;"]],null,null,null,null,null)),(l()(),u.\u0275eld(40,0,null,null,1,"a",[["href","/contact"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cont\xe1ctanos"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(44,0,null,null,3,"button",[["class","btn btn-danger"],["style","  margin-top: 5px; margin-bottom: 5px;"]],null,null,null,null,null)),(l()(),u.\u0275eld(45,0,null,null,1,"a",[["href","/services"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestros Servicios"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t"])),(l()(),u.\u0275eld(52,0,null,null,39,"div",[["class","cardBack"]],null,null,null,null,null)),u.\u0275did(53,278528,null,0,o.NgClass,[u.IterableDiffers,u.KeyValueDiffers,u.ElementRef,u.Renderer2],{klass:[0,"klass"],ngClass:[1,"ngClass"]},null),u.\u0275pod(54,{cardOnTop:0}),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(56,0,null,null,9,"div",[["id","imagenContainer"],["style","margin-bottom:2%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(58,0,null,null,3,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t\n\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(60,0,null,null,0,"img",[["src","../../assets/img/aboutLogo.png"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(63,0,null,null,1,"h1",[],null,null,null,null,null)),(l()(),u.\u0275ted(64,null,["",""])),(l()(),u.\u0275ted(-1,null,["\t\t\t\t\t\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(67,0,null,null,1,"div",[["class","col-xs-12 col-md-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(70,0,null,null,20,"div",[["class","col-xs-12 col-md-8 contenido style-7"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(72,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Quienes Somos"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(75,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(76,null,["\n\t\t\t\t\t\t\t\t","\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(78,0,null,null,11,"div",[["style","     text-align: initial;    margin-top: 5px;    margin-left: 5%; "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(80,0,null,null,3,"button",[["class","btn btn-danger"],["style","  margin-top: 0px;    margin-right: 5%;"]],null,null,null,null,null)),(l()(),u.\u0275eld(81,0,null,null,1,"a",[["href","/contact"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Cont\xe1ctanos"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\t"])),(l()(),u.\u0275eld(85,0,null,null,3,"button",[["class","btn btn-danger"],["style","  margin-top: 5px; margin-bottom: 5px;"]],null,null,null,null,null)),(l()(),u.\u0275eld(86,0,null,null,1,"a",[["href","/customers"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nuestros Aliados"])),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\t\n\t\n\t\t\t\t\t\t\t\n\t\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\n\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\n\t\t\n\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\n"]))],function(l,n){var t=n.component;l(n,16,0,"flipper",l(n,17,0,t.cambio)),l(n,20,0,"cardFront ",l(n,21,0,!t.cambio)),l(n,53,0,"cardBack",l(n,54,0,t.cambio))},function(l,n){var t=n.component;l(n,35,0,t.cardBack),l(n,64,0,t.slogan),l(n,76,0,t.cardFront)})}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-about",[],null,null,null,d,a)),u.\u0275did(1,114688,null,0,i.AboutComponent,[r.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_AboutComponent=a,n.View_AboutComponent_0=d,n.View_AboutComponent_Host_0=s,n.AboutComponentNgFactory=u.\u0275ccf("app-about",i.AboutComponent,s,{},{},[])},VVBd:function(l,n,t){"use strict";n.styles=["#desingBy[_ngcontent-%COMP%]{position:relative;color:#fff;bottom:0;height:4%;width:100%;background-color:#263238;padding-top:.5rem}#social[_ngcontent-%COMP%]{height:-webkit-fit-content;height:-moz-fit-content;height:fit-content;text-align:center;margin-top:150px}#social[_ngcontent-%COMP%]   div[_ngcontent-%COMP%]{margin-bottom:2%}#social[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]{color:#fff}#social[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]   [_ngcontent-%COMP%]:hover{color:#508cd2}.socialLink[_ngcontent-%COMP%]{transition:.5s;margin-left:5%}#contenedorP[_ngcontent-%COMP%]{height:-webkit-fit-content;height:-moz-fit-content;height:fit-content;margin-top:5%}@media (max-width:850px){.container[_ngcontent-%COMP%]{padding:0}#social[_ngcontent-%COMP%]{margin-top:0}#derechos[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:small}}"]},WK6H:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("OQ0P"),u=t("02xY");n.InversionesFormComponent=function(){function l(l){this.fb=l,this.inversionEventValid=new e.EventEmitter,this.inhibidor=!1,this.inversionForm=l.group({edad:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[0-9]+$")])],tipofumador:[null,u.Validators.required]})}return l.prototype.inversionSubmit=function(){var l=this.inversionForm.value;return this.resetear(),l},l.prototype.resetear=function(){this.inversionForm.reset()},l.prototype.ngAfterViewChecked=function(){this.inversionForm.valid&&!this.inhibidor&&(console.log(this.inversionForm.valid),this.inversionEventValid.emit(!0),this.inhibidor=!0),this.inhibidor&&!this.inversionForm.valid&&(this.inhibidor=!1,this.inversionEventValid.emit(!1))},l}()},WcK0:function(l,n,t){"use strict";n.styles=["a[_ngcontent-%COMP%]{color:#fff;font-size:large}a[_ngcontent-%COMP%]:focus, a[_ngcontent-%COMP%]:hover{text-decoration:none;color:#fff}.contenido[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{margin-top:0}#cardHeader[_ngcontent-%COMP%]{margin-top:60px}.flecha[_ngcontent-%COMP%]{width:5vh;margin-bottom:2%}.flechaContainer[_ngcontent-%COMP%]{position:fixed;z-index:1000;width:-webkit-fit-content;width:-moz-fit-content;width:fit-content;display:-ms-grid;display:grid;color:#fff;font-size:3vh}.flechaContainer[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]{height:40px;width:40px;border-radius:50%;box-shadow:0 2px 2px 0 rgba(0,0,0,.14),0 1px 5px 0 rgba(0,0,0,.12),0 3px 1px -2px rgba(0,0,0,.2)}.flechaContainer[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:hover{color:#fff!important}.flechaContainer[_ngcontent-%COMP%]   button[_ngcontent-%COMP%]:focus{outline:none;color:#fff!important}.flechaContainer[_ngcontent-%COMP%]:hover{cursor:pointer}#about[_ngcontent-%COMP%]{height:100%!important;width:100%!important;background:#1d2731;padding-bottom:5%}#imagenContainer[_ngcontent-%COMP%]{width:100%;text-align:center;background:#f1f1f1;padding:10px;height:40vh}#imagenContainer[_ngcontent-%COMP%]   div[_ngcontent-%COMP%]{display:inline-block;width:50%;top:5vh}#imagenContainer[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{padding:0}#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:80%}h1[_ngcontent-%COMP%]{margin:0;font-size:4vh;font-family:Lobster,cursive;color:#010101}#backImage[_ngcontent-%COMP%]{background-image:url(about_ejecutivos.jpg);display:block;width:100%;height:40vh;background-size:cover}.contenido[_ngcontent-%COMP%]{overflow-y:auto;height:40vh}.contenido[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{width:90%;margin:auto;margin-top:2%!important;font-size:large;text-align:justify}.contenido[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%], .contenido[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-family:Dosis,Arimo,sans-serif}.contenido[_ngcontent-%COMP%]   h2[_ngcontent-%COMP%]{font-size:xx-large}.flipContainer[_ngcontent-%COMP%]{perspective:1000px}.rotar[_ngcontent-%COMP%]{transform:rotateY(180deg)}.cardBack[_ngcontent-%COMP%], .cardFront[_ngcontent-%COMP%], .flipContainer[_ngcontent-%COMP%]{width:100%;height:calc(100vh - 80px)}.flipper[_ngcontent-%COMP%]{transition:1s;transform-style:preserve-3d;position:relative}.cardBack[_ngcontent-%COMP%], .cardFront[_ngcontent-%COMP%]{-webkit-backface-visibility:hidden;backface-visibility:hidden;position:absolute;top:0;left:0;background-color:#2c4561;color:#fff;box-shadow:0 2px 5px 0 rgba(0,0,0,.16),0 2px 10px 0 rgba(0,0,0,.12);text-align:center}.cardFront[_ngcontent-%COMP%]{transform:rotateY(0deg)}.cardOnTop[_ngcontent-%COMP%]{z-index:2}.cardBack[_ngcontent-%COMP%]{transform:rotateY(180deg)}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-track{display:none}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar{width:6px;background-color:#2c4561}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-thumb{border-radius:6px;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(.44,#7a99d9),color-stop(.72,#497dbd),color-stop(.86,#1c3a94))}@media (min-width:992px) and (pointer:fine){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:30%}}@media (min-width:992px) and (min-height:750px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:40%}}@media (orientation:portrait){h1[_ngcontent-%COMP%]{padding:5% 0 0 0}.flechaContainer[_ngcontent-%COMP%]{bottom:5%;right:6%}#backImage[_ngcontent-%COMP%]{background-position-x:center;background-position-y:bottom}}@media (orientation:portrait) and (min-height:1000px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:80%}}@media (orientation:portrait) and (min-height:1150px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:100%}}@media (orientation:portrait) and (min-height:1300px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:80%}}@media (orientation:landscape){#backImage[_ngcontent-%COMP%]{background-position-x:right;background-position-y:bottom}h1[_ngcontent-%COMP%]{padding:2% 0 0 0}.flechaContainer[_ngcontent-%COMP%]{bottom:7%;right:3%}}@media (orientation:landscape) and (pointer:coarse){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:45%}}@media (orientation:landscape) and (min-width:500px) and (pointer:coarse){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:35%}}@media (orientation:landscape) and (min-width:800px) and (pointer:coarse){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:25%}}@media (orientation:landscape) and (min-width:1000px) and (pointer:coarse){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:50%}}@media (orientation:landscape) and (max-height:400px) and (pointer:coarse){.contenido[_ngcontent-%COMP%]{height:30vh}}@media (orientation:landscape) and (pointer:coarse) and (min-height:590px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:35%}}@media (orientation:landscape) and (pointer:coarse) and (min-height:1000px){#imagenContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:50%}}"]},XRh5:function(l,n,t){"use strict";n.styles=["#contacto[_ngcontent-%COMP%]{background:#1d2630;width:100%;min-height:100vh;height:100%;padding-bottom:10%}input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[type=submit][_ngcontent-%COMP%]{background-color:#4caf50;color:#fff;padding:12px 20px;border:none;border-radius:4px;cursor:pointer}input[type=submit][_ngcontent-%COMP%]:hover{background-color:#45a049}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}.container[_ngcontent-%COMP%]   #form[_ngcontent-%COMP%]{margin-top:100px;border-radius:5px;background-color:#f2f2f2;padding:20px}"]},XV61:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("OQ0P"),t("A7Ap"),n.HeaderComponent=function(){function l(l){this.router=l,this.menuIsColapsed=!0,this.currPos=0,this.startPos=0,this.changePos=50,this.navbar=[{menu:"Inicio",ruta:"home"},{menu:"Nosotros",ruta:"about"},{menu:"Servicios",ruta:"services"},{menu:"Cotizaciones",ruta:"price"},{menu:"Clientes",ruta:"customers"},{menu:"Contacto",ruta:"contact"}]}return l.prototype.isColapsed=function(){this.menuIsColapsed=!this.menuIsColapsed},l.prototype.ngOnInit=function(){this.router.events.subscribe(function(l){})},l}()},Zq8w:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("JwoV");n.AppServerModuleNgFactory=e.AppServerModuleNgFactory;var u=t("bNRb");n.AppServerModule=u.AppServerModule,n.LAZY_MODULE_MAP={}},aNlo:function(l,n,t){"use strict";n.styles=["input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[type=submit][_ngcontent-%COMP%]{background-color:#4caf50;color:#fff;padding:12px 20px;border:none;border-radius:4px;cursor:pointer}input[type=submit][_ngcontent-%COMP%]:hover{background-color:#45a049}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}"]},"aR8+":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.AppModule=function(){}},aaZ2:function(l,n,t){"use strict";n.styles=[".pageHeader[_ngcontent-%COMP%]{position:absolute;bottom:0;margin-bottom:5%;text-align:center;color:#fff}.pageHeader[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{background:#000}#logoContainer[_ngcontent-%COMP%]{padding:15px;background-color:rgba(80,140,210,.61);box-shadow:0 2px 5px 0 rgba(0,0,0,.16),0 2px 10px 0 rgba(0,0,0,.12)}#logoContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:80%}.texto[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-family:Lobster,cursive}.pageHeader[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%]{font-family:Playfair Display,serif;font-size:8vh}.pageHeader[_ngcontent-%COMP%]   p[_ngcontent-%COMP%]{font-size:4vh}#social[_ngcontent-%COMP%]{margin-top:2%}#social[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]{margin-right:2%;color:#fff;transition:.5s}#social[_ngcontent-%COMP%]   i[_ngcontent-%COMP%]:hover{color:#000;transition:.3s}#contacto[_ngcontent-%COMP%]{height:40px;width:50%;font-size:large;color:#000;margin-top:10px;box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);transition:all .3s cubic-bezier(.25,.8,.25,1)}#contacto[_ngcontent-%COMP%]:hover{background-color:#fff;margin-left:1%;margin-bottom:1%;box-shadow:0 14px 28px rgba(0,0,0,.25),0 10px 10px rgba(0,0,0,.22)}@media(orientation:portrait){.pageHeader[_ngcontent-%COMP%]{margin-bottom:8%}}@media(orientation:landscape) and (pointer:coarse){#logoContainer[_ngcontent-%COMP%]{background-color:initial;box-shadow:none}.container[_ngcontent-%COMP%]{background-color:rgba(80,140,210,.61)}.pageHeader[_ngcontent-%COMP%]{margin-bottom:2%;width:100%}#logoContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:22%}.texto[_ngcontent-%COMP%]   p[_ngcontent-%COMP%], h1[_ngcontent-%COMP%]{margin:0}}@media(orientation:landscape) and (pointer:coarse) and (min-width:850px){#logoContainer[_ngcontent-%COMP%]{background-color:rgba(80,140,210,.61);box-shadow:0 2px 5px 0 rgba(0,0,0,.16),0 2px 10px 0 rgba(0,0,0,.12)}.container[_ngcontent-%COMP%]{background-color:initial}.pageHeader[_ngcontent-%COMP%]{margin-bottom:2%}#logoContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:16%}.texto[_ngcontent-%COMP%]   p[_ngcontent-%COMP%], h1[_ngcontent-%COMP%]{margin:0}#bottomWrapper[_ngcontent-%COMP%]{margin-top:5%}}@media(orientation:portrait) and (min-height:485px){.pageHeader[_ngcontent-%COMP%]{margin-bottom:20%}}@media(orientation:portrait) and (min-height:800px) and (min-width:300px){#bottomWrapper[_ngcontent-%COMP%]{height:10vh}}@media(orientation:portrait) and (min-height:800px) and (min-width:760px){.pageHeader[_ngcontent-%COMP%]{margin-bottom:10%;right:0;left:0}#bottomWrapper[_ngcontent-%COMP%]{height:0}}@media(orientation:portrait) and (min-height:1200px)and (pointer:coarse){#logoContainer[_ngcontent-%COMP%]{margin-bottom:20%}#logoContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:100%!important}}@media (min-width:992px){.texto[_ngcontent-%COMP%]{margin-left:3%}.pageHeader[_ngcontent-%COMP%]{margin-bottom:3%}#contacto[_ngcontent-%COMP%]{font-size:x-large}#logoContainer[_ngcontent-%COMP%]   img[_ngcontent-%COMP%]{width:65%}}"]},bNRb:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.AppServerModule=function(){}},beiE:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.ContactModel=function(l,n,t,e,u,o){this.name=l,this.last=n,this.email=t,this.codigoArea=e,this.phone=u,this.comments=o}},egH5:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("Ir0Z"),u=t("02xY"),o=(t("wp5R"),t("beiE")),i=t("p5Ee");t("JD3r"),n.ContactComponent=function(){function l(l,n,t){this.http=l,this.fb=n,this.metaService=t,this.sending=!1,this.contacto=new o.ContactModel("","","","",null,""),this.headers=new e.HttpHeaders({"Content-Type":"application/json"}),this.contactForm=n.group({name:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[a-zA-Z\xf1\xd1\xe1\xe9\xed\xf3\xfa\xc1\xc9\xcd\xd3\xda]+$")])],last:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[a-zA-Z\xf1\xd1\xe1\xe9\xed\xf3\xfa\xc1\xc9\xcd\xd3\xda]+$")])],email:[null,u.Validators.compose([u.Validators.required,u.Validators.email])],codigoArea:[null,u.Validators.required],phone:[null,u.Validators.compose([u.Validators.required,u.Validators.minLength(7),u.Validators.pattern("^[0-9]+$")])],comments:[null]})}return l.prototype.ngOnInit=function(){this.metaService.addTag({name:"description",content:"Si tienes dudas, comentarios o deseas que te contactemos visita nuestra secci\xf3n de contacto. Queremos conocerte!!!"}),this.metaService.addTag({name:"keywords",content:"Seguros, inversiones"}),this.modalError._modalBody="Favor contacte al administrador enviando un correo a  support@SwordVoice.com ",this.modalError._modalTitle="Hubo un eror enviando tus datos",this.modalError._modalId="error",this.modalSuccess._modalBody="Su Informaci\xf3n fue enviada exitosamente, te estar\xe9 contactando muy pronto.\n\n\t\t         Si lo deseas me puedes contactar via WhatsApp a trav\xe9s del 0412-6994625.\n\n\t\t         Muchas Gracias !!!",this.modalSuccess._modalTitle="Informaci\xf3n Procesada",this.modalSuccess._modalId="success"},l.prototype.onSubmit=function(l){var n=this;this.sending=!0,this.contacto=l,console.log("contacto detalles: "+JSON.stringify(l)+" el dominio es "+i.environment.domain),this.http.post(i.environment.domain+"/email",JSON.stringify(this.contacto),{headers:this.headers}).subscribe(function(l){console.log(l),n.sending=!1,n.modalSuccess.showModal("success"),n.contactForm.reset()},function(l){console.log(l),n.sending=!1,n.contactForm.reset(),n.modalError.showModal("error")})},l}()},f3VV:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("OQ0P"),u=t("02xY");n.AutoFormComponent=function(){function l(l){this.fb=l,this.autoEventValid=new e.EventEmitter,this.inhibidor=!1,this.autoForm=l.group({cedulaTipo:[null,u.Validators.required],cedula:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[0-9]+$"),u.Validators.minLength(6)])],fecha:[null,u.Validators.required],marca:[null,u.Validators.required],modelo:[null,u.Validators.required],year:[null,u.Validators.compose([u.Validators.required,u.Validators.pattern("^[0-9]+$"),u.Validators.maxLength(4),u.Validators.minLength(4)])],version:[null],tipoCaja:[null,u.Validators.required]})}return l.prototype.autoSubmit=function(){var l=this.autoForm.value;return this.resetear(),l},l.prototype.resetear=function(){this.autoForm.reset()},l.prototype.ngAfterViewChecked=function(){this.autoForm.valid&&!this.inhibidor&&(console.log(this.autoForm.valid),this.autoEventValid.emit(!0),this.inhibidor=!0),this.inhibidor&&!this.autoForm.valid&&(this.inhibidor=!1,this.autoEventValid.emit(!1))},l}()},f9NF:function(l,n){l.exports=__webpack_require__(37)},gou4:function(l,n,t){"use strict";var e=t("RYCs"),u=t("OQ0P"),o=t("lIku"),i=t("XV61"),r=t("A7Ap"),a=t("nxKe"),d=t("nVho"),s=t("wQAS"),c=t("wp5R"),p=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function m(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-header",[],null,null,null,o.View_HeaderComponent_0,o.RenderType_HeaderComponent)),u.\u0275did(1,114688,null,0,i.HeaderComponent,[r.Router],null,null),(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(3,16777216,null,null,1,"router-outlet",[],null,null,null,null,null)),u.\u0275did(4,212992,null,0,r.RouterOutlet,[r.ChildrenOutletContexts,u.ViewContainerRef,u.ComponentFactoryResolver,[8,null],u.ChangeDetectorRef],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t"])),(l()(),u.\u0275eld(6,0,null,null,1,"app-footer",[],null,null,null,a.View_FooterComponent_0,a.RenderType_FooterComponent)),u.\u0275did(7,49152,null,0,d.FooterComponent,[],null,null),(l()(),u.\u0275ted(-1,null,["\n\n"]))],function(l,n){l(n,1,0),l(n,4,0)},null)}function g(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-root",[],null,null,null,m,p)),u.\u0275did(1,114688,null,0,s.AppComponent,[c.Title,c.Meta],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_AppComponent=p,n.View_AppComponent_0=m,n.View_AppComponent_Host_0=g,n.AppComponentNgFactory=u.\u0275ccf("app-root",s.AppComponent,g,{},{},[])},hrGf:function(l,n,t){"use strict";var e=t("mi7h"),u=t("OQ0P"),o=t("Hc+a"),i=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function r(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"h3",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Nota:"])),(l()(),u.\u0275ted(-1,null,["\n"])),(l()(),u.\u0275eld(3,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n  Ser\xe1 contactado para comunicarle los requisitos para cotizar dependiendo del patrimonio que desee asegurar\n"])),(l()(),u.\u0275ted(-1,null,["\n"]))],null,null)}function a(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-patrimonio-form",[],null,null,null,r,i)),u.\u0275did(1,114688,null,0,o.PatrimonioFormComponent,[],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_PatrimonioFormComponent=i,n.View_PatrimonioFormComponent_0=r,n.View_PatrimonioFormComponent_Host_0=a,n.PatrimonioFormComponentNgFactory=u.\u0275ccf("app-patrimonio-form",o.PatrimonioFormComponent,a,{},{patriEventValid:"patriEventValid"},[])},i6RS:function(l,n,t){"use strict";var e=t("Rhtm"),u=t("OQ0P"),o=t("02xY"),i=t("yv0u"),r=t("DFBs"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                Este campo es obligatorio, recuerde que solo debe ingresar n\xfameros y sin espacios.          \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "]))],null,null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio   \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "]))],null,null)}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio, recuerde que solo debe ingresar n\xfameros y sin espacios.          \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "]))],null,null)}function p(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,16,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t        "])),(l()(),u.\u0275eld(2,0,null,null,1,"label",[["for","fechaVuelta"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Fecha de Regreso"])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275eld(5,0,null,null,7,"input",[["formControlName","fechaVuelta"],["id","fechaVuelta"],["placeholder","Fecha de regreso.."],["required",""],["type","date"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,6)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,6).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,6)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,6)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(6,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(7,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(10,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(12,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275and(16777216,null,null,1,null,c)),u.\u0275did(15,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n        \t\n        "]))],function(l,n){var t=n.component;l(n,7,0,""),l(n,10,0,"fechaVuelta"),l(n,15,0,t.viajeForm.controls.fechaVuelta.invalid&&t.viajeForm.controls.fechaVuelta.dirty&&t.viajeForm.controls.fechaVuelta.touched)},function(l,n){l(n,5,0,u.\u0275nov(n,7).required?"":null,u.\u0275nov(n,12).ngClassUntouched,u.\u0275nov(n,12).ngClassTouched,u.\u0275nov(n,12).ngClassPristine,u.\u0275nov(n,12).ngClassDirty,u.\u0275nov(n,12).ngClassValid,u.\u0275nov(n,12).ngClassInvalid,u.\u0275nov(n,12).ngClassPending)})}function m(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["    "])),(l()(),u.\u0275eld(1,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Datos del Viaje"])),(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275eld(4,0,null,null,68,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0;return"submit"===n&&(e=!1!==u.\u0275nov(l,6).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,6).onReset()&&e),e},null,null)),u.\u0275did(5,16384,null,0,o.\u0275bf,[],null,null),u.\u0275did(6,540672,null,0,o.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},null),u.\u0275prd(2048,null,o.ControlContainer,null,[o.FormGroupDirective]),u.\u0275did(8,16384,null,0,o.NgControlStatusGroup,[o.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n\n\t"])),(l()(),u.\u0275eld(10,0,null,null,1,"label",[["for","edad"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Edad"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(13,0,null,null,7,"input",[["formControlName","edad"],["id","edad"],["placeholder","Edad del pasajero.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,14)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,14).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,14)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,14)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(14,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(15,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(18,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(20,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(23,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275eld(25,0,null,null,25,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        \t"])),(l()(),u.\u0275eld(27,0,null,null,1,"label",[["for","tipoViaje"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Tipo de boleto"])),(l()(),u.\u0275eld(29,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(31,0,null,null,6,"input",[["formControlName","tipoViaje"],["id","viajeIda"],["name","tipoViaje"],["type","radio"],["value","ida"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,32)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,32).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,32)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,32)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,33).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,33).onTouched()&&e),e},null,null)),u.\u0275did(32,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(33,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(35,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(37,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" Ida "])),(l()(),u.\u0275eld(39,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(41,0,null,null,6,"input",[["formControlName","tipoViaje"],["id","roundTrip"],["name","tipoViaje"],["type","radio"],["value","idaYvuelta"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,42)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,42).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,42)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,42)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,43).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,43).onTouched()&&e),e},null,null)),u.\u0275did(42,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(43,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(45,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(47,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" Ida y Vuelta "])),(l()(),u.\u0275eld(49,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["        \t\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275eld(52,0,null,null,16,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        \t\n\t        "])),(l()(),u.\u0275eld(54,0,null,null,1,"label",[["for","fechaIda"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Fecha de Salida"])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275eld(57,0,null,null,7,"input",[["formControlName","fechaIda"],["id","fechaIda"],["required",""],["type","date"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,58)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,58).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,58)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,58)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(58,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(59,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(62,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(64,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275and(16777216,null,null,1,null,s)),u.\u0275did(67,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n\n        "])),(l()(),u.\u0275and(16777216,null,null,1,null,p)),u.\u0275did(71,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,6,0,t.viajeForm),l(n,15,0,""),l(n,18,0,"edad"),l(n,23,0,t.viajeForm.controls.edad.invalid&&t.viajeForm.controls.edad.dirty&&t.viajeForm.controls.edad.touched),l(n,33,0,"tipoViaje","tipoViaje","ida"),l(n,35,0,"tipoViaje"),l(n,43,0,"tipoViaje","tipoViaje","idaYvuelta"),l(n,45,0,"tipoViaje"),l(n,59,0,""),l(n,62,0,"fechaIda"),l(n,67,0,t.viajeForm.controls.fechaIda.invalid&&t.viajeForm.controls.fechaIda.dirty&&t.viajeForm.controls.fechaIda.touched),l(n,71,0,"idaYvuelta"===t.viajeForm.value.tipoViaje)},function(l,n){l(n,4,0,u.\u0275nov(n,8).ngClassUntouched,u.\u0275nov(n,8).ngClassTouched,u.\u0275nov(n,8).ngClassPristine,u.\u0275nov(n,8).ngClassDirty,u.\u0275nov(n,8).ngClassValid,u.\u0275nov(n,8).ngClassInvalid,u.\u0275nov(n,8).ngClassPending),l(n,13,0,u.\u0275nov(n,15).required?"":null,u.\u0275nov(n,20).ngClassUntouched,u.\u0275nov(n,20).ngClassTouched,u.\u0275nov(n,20).ngClassPristine,u.\u0275nov(n,20).ngClassDirty,u.\u0275nov(n,20).ngClassValid,u.\u0275nov(n,20).ngClassInvalid,u.\u0275nov(n,20).ngClassPending),l(n,31,0,u.\u0275nov(n,37).ngClassUntouched,u.\u0275nov(n,37).ngClassTouched,u.\u0275nov(n,37).ngClassPristine,u.\u0275nov(n,37).ngClassDirty,u.\u0275nov(n,37).ngClassValid,u.\u0275nov(n,37).ngClassInvalid,u.\u0275nov(n,37).ngClassPending),l(n,41,0,u.\u0275nov(n,47).ngClassUntouched,u.\u0275nov(n,47).ngClassTouched,u.\u0275nov(n,47).ngClassPristine,u.\u0275nov(n,47).ngClassDirty,u.\u0275nov(n,47).ngClassValid,u.\u0275nov(n,47).ngClassInvalid,u.\u0275nov(n,47).ngClassPending),l(n,57,0,u.\u0275nov(n,59).required?"":null,u.\u0275nov(n,64).ngClassUntouched,u.\u0275nov(n,64).ngClassTouched,u.\u0275nov(n,64).ngClassPristine,u.\u0275nov(n,64).ngClassDirty,u.\u0275nov(n,64).ngClassValid,u.\u0275nov(n,64).ngClassInvalid,u.\u0275nov(n,64).ngClassPending)})}function g(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-viaje-form",[],null,null,null,m,a)),u.\u0275did(1,8437760,null,0,r.ViajeFormComponent,[o.FormBuilder],null,null)],null,null)}n.RenderType_ViajeFormComponent=a,n.View_ViajeFormComponent_0=m,n.View_ViajeFormComponent_Host_0=g,n.ViajeFormComponentNgFactory=u.\u0275ccf("app-viaje-form",r.ViajeFormComponent,g,{},{viajeEventValid:"viajeEventValid"},[])},jBio:function(l,n,t){"use strict";n.styles=["#headerImg[_ngcontent-%COMP%]{background-image:url(calidad.jpg);background-size:cover;background-position-x:center;background-position-y:50%;width:100%;min-height:60vh}.scrolleable[_ngcontent-%COMP%]{overflow-y:scroll}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-track{-webkit-box-shadow:inset 0 0 6px rgba(0,0,0,.2);background-color:#fff;border-radius:6px}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar{width:6px;background-color:#fff}.style-7[_ngcontent-%COMP%]::-webkit-scrollbar-thumb{border-radius:6px;background-image:-webkit-gradient(linear,left bottom,left top,color-stop(.44,#7a99d9),color-stop(.72,#497dbd),color-stop(.86,#1c3a94))}"]},l0JX:function(l,n){l.exports=__webpack_require__(38)},lIku:function(l,n,t){"use strict";var e=t("SWpx"),u=t("OQ0P"),o=t("A7Ap"),i=t("yv0u"),r=t("XV61"),a=u.\u0275crt({encapsulation:2,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,8,"li",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n      \t      \t\t\t"])),(l()(),u.\u0275eld(2,0,null,null,4,"a",[["routerLinkActive","activeMenu"]],[[8,"href",4]],null,null,null,null)),u.\u0275did(3,1720320,null,2,o.RouterLinkActive,[o.Router,u.ElementRef,u.Renderer2,u.ChangeDetectorRef],{routerLinkActive:[0,"routerLinkActive"]},null),u.\u0275qud(603979776,2,{links:1}),u.\u0275qud(603979776,3,{linksWithHrefs:1}),(l()(),u.\u0275ted(6,null,[" "," "])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275ted(-1,null,["\n      \t    "]))],function(l,n){l(n,3,0,"activeMenu")},function(l,n){l(n,2,0,u.\u0275inlineInterpolate(1,"/",n.context.$implicit.ruta,"")),l(n,6,0,n.context.$implicit.menu)})}function s(l){return u.\u0275vid(0,[u.\u0275qud(402653184,1,{butonMenu:0}),(l()(),u.\u0275ted(-1,null,["\n  "])),(l()(),u.\u0275eld(2,0,null,null,52,"nav",[["class","navbar navbar-default navbar-fixed-top "],["id","menu"],["role","navigation"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["  \n  "])),(l()(),u.\u0275ted(-1,null,["\n    "])),(l()(),u.\u0275eld(5,0,null,null,48,"div",[["class","container"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n    \t"])),(l()(),u.\u0275eld(7,0,null,null,36,"div",[["class","navbar-header"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275ted(-1,null,["\n          "])),(l()(),u.\u0275eld(10,0,null,null,18,"div",[["class","navbar-brand"],["id","websiteName"],["style","    display: flex;    padding-top: 0px;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(12,0,null,null,7,"div",[["style","width:fit-content"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n              "])),(l()(),u.\u0275eld(14,0,null,null,4,"a",[["routerLink","/home"]],[[1,"target",0],[8,"href",4]],[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==u.\u0275nov(l,15).onClick(t.button,t.ctrlKey,t.metaKey,t.shiftKey)&&e),e},null,null)),u.\u0275did(15,671744,null,0,o.RouterLinkWithHref,[o.Router,o.ActivatedRoute,i.LocationStrategy],{routerLink:[0,"routerLink"]},null),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(17,0,null,null,0,"img",[["src","../assets/img/aboutLogoMin.png"],["style","width:50px"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n              "])),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275ted(-1,null,["\n              "])),(l()(),u.\u0275eld(21,0,null,null,6,"a",[["routerLink","/home"],["style","    margin-top: 15px;"]],[[1,"target",0],[8,"href",4]],[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==u.\u0275nov(l,22).onClick(t.button,t.ctrlKey,t.metaKey,t.shiftKey)&&e),e},null,null)),u.\u0275did(22,671744,null,0,o.RouterLinkWithHref,[o.Router,o.ActivatedRoute,i.LocationStrategy],{routerLink:[0,"routerLink"]},null),(l()(),u.\u0275ted(-1,null,[" "])),(l()(),u.\u0275eld(24,0,null,null,1,"span",[["class","fuerte"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["otif"])),(l()(),u.\u0275eld(26,0,null,null,1,"span",[["class","debil"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Seguros"])),(l()(),u.\u0275ted(-1,null,["\n          "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n\n      "])),(l()(),u.\u0275eld(31,0,[["botonMenu",1]],null,11,"button",[["class","navbar-toggle"],["data-target","#barraPrincipal"],["data-toggle","collapse"],["id","botonColapse"],["type","button"]],null,[[null,"click"]],function(l,n,t){var e=!0;return"click"===n&&(e=!1!==l.component.isColapsed()&&e),e},null,null)),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(34,0,null,null,1,"span",[["class","sr-only"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Desplegar navegaci\xf3n"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(37,0,null,null,0,"span",[["class","icon-bar"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(39,0,null,null,0,"span",[["class","icon-bar"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(41,0,null,null,0,"span",[["class","icon-bar"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n      "])),(l()(),u.\u0275ted(-1,null,["\n      \n    "])),(l()(),u.\u0275ted(-1,null,["\n\n      \t"])),(l()(),u.\u0275eld(45,0,null,null,7,"div",[["class","navbar-collapse collapse"],["id","barraPrincipal"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n          "])),(l()(),u.\u0275eld(47,0,null,null,4,"ul",[["class","nav navbar-nav navbar-right navbar-toggler-right"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n      \t    "])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(50,802816,null,0,i.NgForOf,[u.ViewContainerRef,u.TemplateRef,u.IterableDiffers],{ngForOf:[0,"ngForOf"]},null),(l()(),u.\u0275ted(-1,null,["\n          "])),(l()(),u.\u0275ted(-1,null,["\n    \t "])),(l()(),u.\u0275ted(-1,null,["\n\n     "])),(l()(),u.\u0275ted(-1,null,["\n\n  "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,15,0,"/home"),l(n,22,0,"/home"),l(n,50,0,t.navbar)},function(l,n){l(n,14,0,u.\u0275nov(n,15).target,u.\u0275nov(n,15).href),l(n,21,0,u.\u0275nov(n,22).target,u.\u0275nov(n,22).href)})}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-header",[],null,null,null,s,a)),u.\u0275did(1,114688,null,0,r.HeaderComponent,[o.Router],null,null)],function(l,n){l(n,1,0)},null)}n.RenderType_HeaderComponent=a,n.View_HeaderComponent_0=s,n.View_HeaderComponent_Host_0=c,n.HeaderComponentNgFactory=u.\u0275ccf("app-header",r.HeaderComponent,c,{},{},[])},mi7h:function(l,n,t){"use strict";n.styles=[""]},nVho:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.FooterComponent=function(){}},nioL:function(l,n,t){"use strict";var e=t("CaZB"),u=t("OQ0P"),o=t("02xY"),i=t("yv0u"),r=t("f3VV"),a=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function d(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio.          \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t    "]))],null,null)}function s(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class","alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio.          \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "]))],null,null)}function c(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class"," alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio.      \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t    \t"]))],null,null)}function p(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class"," alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio.    \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t    \t"]))],null,null)}function m(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class"," alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t                Este campo es obligatorio. Solo n\xfameros en formato aaaa Ej: 1995         \n\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t    \t"]))],null,null)}function g(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,4,"div",[["class"," alert alert-danger"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t            "])),(l()(),u.\u0275eld(2,0,null,null,1,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t                Este campo es obligatorio.        \n\t\t\t            "])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t    \t"]))],null,null)}function v(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,171,"form",[["novalidate",""]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"submit"],[null,"reset"]],function(l,n,t){var e=!0;return"submit"===n&&(e=!1!==u.\u0275nov(l,2).onSubmit(t)&&e),"reset"===n&&(e=!1!==u.\u0275nov(l,2).onReset()&&e),e},null,null)),u.\u0275did(1,16384,null,0,o.\u0275bf,[],null,null),u.\u0275did(2,540672,null,0,o.FormGroupDirective,[[8,null],[8,null]],{form:[0,"form"]},null),u.\u0275prd(2048,null,o.ControlContainer,null,[o.FormGroupDirective]),u.\u0275did(4,16384,null,0,o.NgControlStatusGroup,[o.ControlContainer],null,null),(l()(),u.\u0275ted(-1,null,["\n\n\n\t"])),(l()(),u.\u0275eld(6,0,null,null,1,"label",[["for","cedulaTipo"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["N\xfamero de C\xe9dula"])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275eld(9,0,null,null,36,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(11,0,null,null,21,"div",[["class","col-xs-12 col-sm-4 col-md-2"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(13,0,null,null,18,"select",[["formControlName","cedulaTipo"],["required",""]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"change"],[null,"blur"]],function(l,n,t){var e=!0;return"change"===n&&(e=!1!==u.\u0275nov(l,14).onChange(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,14).onTouched()&&e),e},null,null)),u.\u0275did(14,16384,null,0,o.SelectControlValueAccessor,[u.Renderer2,u.ElementRef],null,null),u.\u0275did(15,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.SelectControlValueAccessor]),u.\u0275did(18,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(20,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(22,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(23,147456,null,0,o.NgSelectOption,[u.ElementRef,u.Renderer2,[2,o.SelectControlValueAccessor]],null,null),u.\u0275did(24,147456,null,0,o.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["V"])),(l()(),u.\u0275ted(-1,null,["\n                    "])),(l()(),u.\u0275eld(27,0,null,null,3,"option",[],null,null,null,null,null)),u.\u0275did(28,147456,null,0,o.NgSelectOption,[u.ElementRef,u.Renderer2,[2,o.SelectControlValueAccessor]],null,null),u.\u0275did(29,147456,null,0,o.\u0275q,[u.ElementRef,u.Renderer2,[8,null]],null,null),(l()(),u.\u0275ted(-1,null,["E"])),(l()(),u.\u0275ted(-1,null,["\n\n                "])),(l()(),u.\u0275ted(-1,null,["                \n            "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(34,0,null,null,10,"div",[["class","col-xs-12 col-sm-8 col-md-10"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(36,0,null,null,7,"input",[["formControlName","cedula"],["id","cedula"],["placeholder","Su N\xfamero de C\xe9dula.."],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,37)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,37).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,37)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,37)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(37,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(38,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(41,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(43,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n                \n            "])),(l()(),u.\u0275ted(-1,null,["\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275and(16777216,null,null,1,null,d)),u.\u0275did(48,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n\n\n        "])),(l()(),u.\u0275eld(50,0,null,null,1,"label",[["for","fecha"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Fecha de Nacimiento"])),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275eld(53,0,null,null,7,"input",[["formControlName","fecha"],["id","fecha"],["placeholder","Fecha de Nacimiento.."],["required",""],["type","date"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,54)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,54).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,54)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,54)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(54,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(55,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(58,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(60,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t\t        "])),(l()(),u.\u0275and(16777216,null,null,1,null,s)),u.\u0275did(63,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n    "])),(l()(),u.\u0275eld(65,0,null,null,1,"h2",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Datos del Autom\xf3vil"])),(l()(),u.\u0275ted(-1,null,["\n\n        "])),(l()(),u.\u0275eld(68,0,null,null,37,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(70,0,null,null,16,"div",[["class","col-xs-12 col-md-6"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(72,0,null,null,1,"label",[["for","marca"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Marca"])),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(75,0,null,null,7,"input",[["formControlName","marca"],["id","marca"],["placeholder","Ej: Ford"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,76)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,76).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,76)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,76)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(76,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(77,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(80,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(82,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\n                "])),(l()(),u.\u0275and(16777216,null,null,1,null,c)),u.\u0275did(85,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(88,0,null,null,16,"div",[["class","col-xs-12 col-md-6 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t"])),(l()(),u.\u0275eld(90,0,null,null,1,"label",[["for","modelo"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Modelo"])),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(93,0,null,null,7,"input",[["formControlName","modelo"],["id","modelo"],["placeholder","Ej: Spark"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,94)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,94).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,94)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,94)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(94,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(95,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(98,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(100,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n       \t\t    "])),(l()(),u.\u0275and(16777216,null,null,1,null,p)),u.\u0275did(103,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n                \n            "])),(l()(),u.\u0275ted(-1,null,["\n\n         "])),(l()(),u.\u0275ted(-1,null,["\n\n\n "])),(l()(),u.\u0275eld(107,0,null,null,35,"div",[["class","row"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n           "])),(l()(),u.\u0275eld(109,0,null,null,16,"div",[["class","col-xs-12 col-md-6"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n            "])),(l()(),u.\u0275eld(111,0,null,null,1,"label",[["for","year"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["A\xf1o"])),(l()(),u.\u0275ted(-1,null,["\n                "])),(l()(),u.\u0275eld(114,0,null,null,7,"input",[["formControlName","year"],["id","year"],["placeholder","Ej: 2005"],["required",""],["type","text"]],[[1,"required",0],[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,115)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,115).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,115)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,115)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(115,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(116,16384,null,0,o.RequiredValidator,[],{required:[0,"required"]},null),u.\u0275prd(1024,null,o.NG_VALIDATORS,function(l){return[l]},[o.RequiredValidator]),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(119,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[2,o.NG_VALIDATORS],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(121,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\n                "])),(l()(),u.\u0275and(16777216,null,null,1,null,m)),u.\u0275did(124,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275ted(-1,null,["\n\n            "])),(l()(),u.\u0275eld(127,0,null,null,14,"div",[["class","col-xs-12 col-md-6 "]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t          \t"])),(l()(),u.\u0275eld(129,0,null,null,1,"label",[["for","version"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Versi\xf3n"])),(l()(),u.\u0275ted(-1,null,["\n\n\t                "])),(l()(),u.\u0275eld(132,0,null,null,5,"input",[["formControlName","version"],["id","version"],["placeholder","Ej: sedan"],["type","text"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,133)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,133).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,133)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,133)._compositionEnd(t.target.value)&&e),e},null,null)),u.\u0275did(133,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l){return[l]},[o.DefaultValueAccessor]),u.\u0275did(135,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(137,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,["\n\t       \t\t    "])),(l()(),u.\u0275and(16777216,null,null,1,null,g)),u.\u0275did(140,16384,null,0,i.NgIf,[u.ViewContainerRef,u.TemplateRef],{ngIf:[0,"ngIf"]},null),(l()(),u.\u0275ted(-1,null,["\n\t                \n            "])),(l()(),u.\u0275ted(-1,null,["\n\n\n "])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n        "])),(l()(),u.\u0275eld(144,0,null,null,25,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n        \t"])),(l()(),u.\u0275eld(146,0,null,null,1,"label",[["for","tipoCaja"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Transmisi\xf3n"])),(l()(),u.\u0275eld(148,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(150,0,null,null,6,"input",[["formControlName","tipoCaja"],["name","tipoCaja"],["type","radio"],["value","Autom\xe1tica"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,151)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,151).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,151)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,151)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,152).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,152).onTouched()&&e),e},null,null)),u.\u0275did(151,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(152,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(154,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(156,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" Autom\xe1tica "])),(l()(),u.\u0275eld(158,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t        \t"])),(l()(),u.\u0275eld(160,0,null,null,6,"input",[["formControlName","tipoCaja"],["name","tipoCaja"],["type","radio"],["value","Sincr\xf3nica"]],[[2,"ng-untouched",null],[2,"ng-touched",null],[2,"ng-pristine",null],[2,"ng-dirty",null],[2,"ng-valid",null],[2,"ng-invalid",null],[2,"ng-pending",null]],[[null,"input"],[null,"blur"],[null,"compositionstart"],[null,"compositionend"],[null,"change"]],function(l,n,t){var e=!0;return"input"===n&&(e=!1!==u.\u0275nov(l,161)._handleInput(t.target.value)&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,161).onTouched()&&e),"compositionstart"===n&&(e=!1!==u.\u0275nov(l,161)._compositionStart()&&e),"compositionend"===n&&(e=!1!==u.\u0275nov(l,161)._compositionEnd(t.target.value)&&e),"change"===n&&(e=!1!==u.\u0275nov(l,162).onChange()&&e),"blur"===n&&(e=!1!==u.\u0275nov(l,162).onTouched()&&e),e},null,null)),u.\u0275did(161,16384,null,0,o.DefaultValueAccessor,[u.Renderer2,u.ElementRef,[2,o.COMPOSITION_BUFFER_MODE]],null,null),u.\u0275did(162,212992,null,0,o.RadioControlValueAccessor,[u.Renderer2,u.ElementRef,o.\u0275i,u.Injector],{name:[0,"name"],formControlName:[1,"formControlName"],value:[2,"value"]},null),u.\u0275prd(1024,null,o.NG_VALUE_ACCESSOR,function(l,n){return[l,n]},[o.DefaultValueAccessor,o.RadioControlValueAccessor]),u.\u0275did(164,671744,null,0,o.FormControlName,[[3,o.ControlContainer],[8,null],[8,null],[2,o.NG_VALUE_ACCESSOR]],{name:[0,"name"]},null),u.\u0275prd(2048,null,o.NgControl,null,[o.FormControlName]),u.\u0275did(166,16384,null,0,o.NgControlStatus,[o.NgControl],null,null),(l()(),u.\u0275ted(-1,null,[" Sincr\xf3nica "])),(l()(),u.\u0275eld(168,0,null,null,0,"br",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["        \t\n        "])),(l()(),u.\u0275ted(-1,null,["\n\n\n        "])),(l()(),u.\u0275ted(-1,null,["\n "])),(l()(),u.\u0275ted(-1,null,["\n"]))],function(l,n){var t=n.component;l(n,2,0,t.autoForm),l(n,15,0,""),l(n,18,0,"cedulaTipo"),l(n,38,0,""),l(n,41,0,"cedula"),l(n,48,0,t.autoForm.controls.cedula.invalid&&t.autoForm.controls.cedula.dirty&&t.autoForm.controls.cedula.touched),l(n,55,0,""),l(n,58,0,"fecha"),l(n,63,0,t.autoForm.controls.fecha.invalid&&t.autoForm.controls.fecha.dirty&&t.autoForm.controls.fecha.touched),l(n,77,0,""),l(n,80,0,"marca"),l(n,85,0,t.autoForm.controls.marca.invalid&&t.autoForm.controls.marca.dirty&&t.autoForm.controls.marca.touched),l(n,95,0,""),l(n,98,0,"modelo"),l(n,103,0,t.autoForm.controls.modelo.invalid&&t.autoForm.controls.modelo.dirty&&t.autoForm.controls.modelo.touched),l(n,116,0,""),l(n,119,0,"year"),l(n,124,0,t.autoForm.controls.year.invalid&&t.autoForm.controls.year.dirty&&t.autoForm.controls.year.touched),l(n,135,0,"version"),l(n,140,0,t.autoForm.controls.version.invalid&&t.autoForm.controls.version.dirty&&t.autoForm.controls.version.touched),l(n,152,0,"tipoCaja","tipoCaja","Autom\xe1tica"),l(n,154,0,"tipoCaja"),l(n,162,0,"tipoCaja","tipoCaja","Sincr\xf3nica"),l(n,164,0,"tipoCaja")},function(l,n){l(n,0,0,u.\u0275nov(n,4).ngClassUntouched,u.\u0275nov(n,4).ngClassTouched,u.\u0275nov(n,4).ngClassPristine,u.\u0275nov(n,4).ngClassDirty,u.\u0275nov(n,4).ngClassValid,u.\u0275nov(n,4).ngClassInvalid,u.\u0275nov(n,4).ngClassPending),l(n,13,0,u.\u0275nov(n,15).required?"":null,u.\u0275nov(n,20).ngClassUntouched,u.\u0275nov(n,20).ngClassTouched,u.\u0275nov(n,20).ngClassPristine,u.\u0275nov(n,20).ngClassDirty,u.\u0275nov(n,20).ngClassValid,u.\u0275nov(n,20).ngClassInvalid,u.\u0275nov(n,20).ngClassPending),l(n,36,0,u.\u0275nov(n,38).required?"":null,u.\u0275nov(n,43).ngClassUntouched,u.\u0275nov(n,43).ngClassTouched,u.\u0275nov(n,43).ngClassPristine,u.\u0275nov(n,43).ngClassDirty,u.\u0275nov(n,43).ngClassValid,u.\u0275nov(n,43).ngClassInvalid,u.\u0275nov(n,43).ngClassPending),l(n,53,0,u.\u0275nov(n,55).required?"":null,u.\u0275nov(n,60).ngClassUntouched,u.\u0275nov(n,60).ngClassTouched,u.\u0275nov(n,60).ngClassPristine,u.\u0275nov(n,60).ngClassDirty,u.\u0275nov(n,60).ngClassValid,u.\u0275nov(n,60).ngClassInvalid,u.\u0275nov(n,60).ngClassPending),l(n,75,0,u.\u0275nov(n,77).required?"":null,u.\u0275nov(n,82).ngClassUntouched,u.\u0275nov(n,82).ngClassTouched,u.\u0275nov(n,82).ngClassPristine,u.\u0275nov(n,82).ngClassDirty,u.\u0275nov(n,82).ngClassValid,u.\u0275nov(n,82).ngClassInvalid,u.\u0275nov(n,82).ngClassPending),l(n,93,0,u.\u0275nov(n,95).required?"":null,u.\u0275nov(n,100).ngClassUntouched,u.\u0275nov(n,100).ngClassTouched,u.\u0275nov(n,100).ngClassPristine,u.\u0275nov(n,100).ngClassDirty,u.\u0275nov(n,100).ngClassValid,u.\u0275nov(n,100).ngClassInvalid,u.\u0275nov(n,100).ngClassPending),l(n,114,0,u.\u0275nov(n,116).required?"":null,u.\u0275nov(n,121).ngClassUntouched,u.\u0275nov(n,121).ngClassTouched,u.\u0275nov(n,121).ngClassPristine,u.\u0275nov(n,121).ngClassDirty,u.\u0275nov(n,121).ngClassValid,u.\u0275nov(n,121).ngClassInvalid,u.\u0275nov(n,121).ngClassPending),l(n,132,0,u.\u0275nov(n,137).ngClassUntouched,u.\u0275nov(n,137).ngClassTouched,u.\u0275nov(n,137).ngClassPristine,u.\u0275nov(n,137).ngClassDirty,u.\u0275nov(n,137).ngClassValid,u.\u0275nov(n,137).ngClassInvalid,u.\u0275nov(n,137).ngClassPending),l(n,150,0,u.\u0275nov(n,156).ngClassUntouched,u.\u0275nov(n,156).ngClassTouched,u.\u0275nov(n,156).ngClassPristine,u.\u0275nov(n,156).ngClassDirty,u.\u0275nov(n,156).ngClassValid,u.\u0275nov(n,156).ngClassInvalid,u.\u0275nov(n,156).ngClassPending),l(n,160,0,u.\u0275nov(n,166).ngClassUntouched,u.\u0275nov(n,166).ngClassTouched,u.\u0275nov(n,166).ngClassPristine,u.\u0275nov(n,166).ngClassDirty,u.\u0275nov(n,166).ngClassValid,u.\u0275nov(n,166).ngClassInvalid,u.\u0275nov(n,166).ngClassPending)})}function f(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-auto-form",[],null,null,null,v,a)),u.\u0275did(1,8437760,null,0,r.AutoFormComponent,[o.FormBuilder],null,null)],null,null)}n.RenderType_AutoFormComponent=a,n.View_AutoFormComponent_0=v,n.View_AutoFormComponent_Host_0=f,n.AutoFormComponentNgFactory=u.\u0275ccf("app-auto-form",r.AutoFormComponent,f,{},{autoEventValid:"autoEventValid"},[])},nxKe:function(l,n,t){"use strict";var e=t("VVBd"),u=t("OQ0P"),o=t("nVho"),i=u.\u0275crt({encapsulation:0,styles:[e.styles],data:{}});function r(l){return u.\u0275vid(0,[(l()(),u.\u0275ted(-1,null,["  "])),(l()(),u.\u0275eld(1,0,null,null,56,"footer",[["id","desingBy"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n  \t"])),(l()(),u.\u0275eld(3,0,null,null,53,"div",[["class","container"],["id","contenedorP"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n  \t\t  \t"])),(l()(),u.\u0275eld(5,0,null,null,39,"div",[["class","  col-xs-12 col-md-6 "],["id","social"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275eld(7,0,null,null,10,"div",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(9,0,null,null,1,"a",[["href","https://www.facebook.com/motifseguros1/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(10,0,null,null,0,"i",[["aria-hidden","true"],["class","fa-3x fab fa-facebook-square"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(12,0,null,null,1,"a",[["class","socialLink"],["href","https://twitter.com/motifseguros"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(13,0,null,null,0,"i",[["aria-hidden","true"],["class","fa-3x fab fa-twitter-square"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \n\t\t\t\t\t"])),(l()(),u.\u0275eld(15,0,null,null,1,"a",[["class","socialLink"],["href","https://www.instagram.com/motifseguros/"],["target","_blank"]],null,null,null,null,null)),(l()(),u.\u0275eld(16,0,null,null,0,"i",[["aria-hidden","true"],["class","fab fa-3x fa-instagram"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(19,0,null,null,12,"div",[["style","display:inline-flex"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(21,0,null,null,3,"div",[["style","width:fit-content"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(23,0,null,null,0,"i",[["aria-hidden","true"],["class","fa-2x fab fa-whatsapp"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(26,0,null,null,4,"div",[["style","width:fit-content; margin-top:1%;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t\t"])),(l()(),u.\u0275eld(28,0,null,null,1,"p",[["style","    font-size: large;padding-left: 10px;    margin-bottom: 0px;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" +58 (412) 699-4625"])),(l()(),u.\u0275ted(-1,null,["\t\n\t\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\t\t\t\t\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(33,0,null,null,10,"div",[["style","width:100%"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\t\t\t\t\t"])),(l()(),u.\u0275eld(35,0,null,null,1,"p",[["style","   font-size: large;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Caracas, Venezuela"])),(l()(),u.\u0275ted(-1,null,["\n\t  \t\t\t\t"])),(l()(),u.\u0275eld(38,0,null,null,4,"p",[["style","   font-size: large;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["Dise\xf1o Web por "])),(l()(),u.\u0275eld(40,0,null,null,1,"a",[["href","https://www.facebook.com/SwordVoice/"],["style","   color:#508cd2;"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["SwordVoice.com"])),(l()(),u.\u0275ted(-1,null,[" 2018"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\n\t\t\t"])),(l()(),u.\u0275eld(46,0,null,null,3,"div",[["class","  col-xs-12 col-md-6 "],["style","text-align:center;padding:0"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t\t"])),(l()(),u.\u0275eld(48,0,null,null,0,"iframe",[["allowTransparency","true"],["frameborder","0"],["height","400"],["scrolling","no"],["src","https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FMotifSeguros-169797503641566%2F%3Fnotif_id%3D1517627220600844%26notif_t%3Dpage_invite%26ref%3Dnotif&tabs=timeline&width=300&height=400&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId"],["style","border:none;overflow:hidden"],["width","300"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\n\n\t\t\t"])),(l()(),u.\u0275eld(51,0,null,null,4,"div",[["class","  col-xs-12 "],["id","derechos"],["style","text-align:center; margin-top:2% ; font-size: medium"]],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,["\n\n\t\t  \t\t\t"])),(l()(),u.\u0275eld(53,0,null,null,1,"p",[],null,null,null,null,null)),(l()(),u.\u0275ted(-1,null,[" \xa9 2018 - MotifSeguros | Todos los derechos reservados."])),(l()(),u.\u0275ted(-1,null,["\t\t\t \n\t\t\t"])),(l()(),u.\u0275ted(-1,null,["\t\n\n\n\t\t\n\n\n\n  \t"])),(l()(),u.\u0275ted(-1,null,["\n\n  "])),(l()(),u.\u0275ted(-1,null,["\t"]))],null,null)}function a(l){return u.\u0275vid(0,[(l()(),u.\u0275eld(0,0,null,null,1,"app-footer",[],null,null,null,r,i)),u.\u0275did(1,49152,null,0,o.FooterComponent,[],null,null)],null,null)}n.RenderType_FooterComponent=i,n.View_FooterComponent_0=r,n.View_FooterComponent_Host_0=a,n.FooterComponentNgFactory=u.\u0275ccf("app-footer",o.FooterComponent,a,{},{},[])},p5Ee:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.environment={production:!0,domain:"https://www.motifseguros.com"}},rR6K:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.BackgroundComponent=function(){}},"t4+y":function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("wp5R"),n.AboutComponent=function(){function l(l){this.metaService=l,this.slogan="\xa1Tu Bienestar es nuestro compromiso!",this.cardFront="Somos un grupo de asesores en planificaci\xf3n estrat\xe9gica financiera con una amplia experiencia en el mercado asegurador en Venezuela y el resto del mundo. Nuestras especialidades incluyen el \xe1rea de protecci\xf3n de familias, empresas y bienes.\nNuestros aliados est\xe1n respaldados por la Lloyd\u2019s of London (reaseguradora m\xe1s prestigiosa a nivel global) y que a su vez se encuentran entre las principales empresas m\xe1s importantes de los Estados Unidos, amparado por el \xcdndice Burs\xe1til S&P 500 ( Indicador que mide la confiabilidad empresarial ). \n",this.cardBack="  Estamos comprometidos con nuestros clientes para que puedan lograr su libertad financiera a trav\xe9s del respaldo de empresas nacionales e internacionales, con novedosos productos de seguros e inversiones que se adaptan a tus necesidades. Pensando siempre en la protecci\xf3n de tu familia, empresas y bienes.",this.cambio=!1}return l.prototype.ngOnInit=function(){var l=this;setTimeout(function(n){return l.flip()},200),this.metaService.addTag({name:"description",content:"Somos un grupo de asesores financieros con gran experiencia en el mercado. Nuestro compromiso es tu seguridad y bienestar"}),this.metaService.addTag({name:"keywords",content:"Consultores,Finanzas,Asesores financieros"})},l.prototype.flip=function(){this.cambio=!this.cambio},l}()},tylh:function(l,n,t){"use strict";n.styles=["input[type=date][_ngcontent-%COMP%], input[type=text][_ngcontent-%COMP%], select[_ngcontent-%COMP%], textarea[_ngcontent-%COMP%]{width:100%;padding:12px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;margin-top:6px;margin-bottom:16px;resize:vertical}input[disabled][_ngcontent-%COMP%]{background-color:#777}input[disabled][_ngcontent-%COMP%]:hover{cursor:auto;background-color:#777}"]},wQAS:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),t("wp5R");var e=function(){function l(l,n){this.titleService=l,this.metaService=n,this.title="app"}return l.prototype.ngOnInit=function(){this.titleService.setTitle("MotifSeguros | Seguros e Inversiones")},l}();n.AppComponent=e},wZ9U:function(l,n,t){"use strict";Object.defineProperty(n,"__esModule",{value:!0});var e=t("OQ0P"),u=t("02xY");n.SaludFormComponent=function(){function l(l){this.fb=l,this.saludEventValid=new e.EventEmitter,this.inhibidor=!1,this.saludForm=l.group({fecha:[null,u.Validators.required]})}return l.prototype.saludSubmit=function(){var l=this.saludForm.value;return this.resetear(),l},l.prototype.resetear=function(){this.saludForm.reset()},l.prototype.ngAfterViewChecked=function(){this.saludForm.valid&&!this.inhibidor&&(console.log(this.saludForm.valid),this.saludEventValid.emit(!0),this.inhibidor=!0),this.inhibidor&&!this.saludForm.valid&&(this.inhibidor=!1,this.saludEventValid.emit(!1))},l}()},wp5R:function(l,n){l.exports=__webpack_require__(39)},yv0u:function(l,n){l.exports=__webpack_require__(40)}}));

/***/ }),
/* 32 */
/***/ (function(module, exports) {

module.exports = require("@angular/forms");

/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = require("@angular/animations/browser");

/***/ }),
/* 34 */
/***/ (function(module, exports) {

module.exports = require("@angular/router");

/***/ }),
/* 35 */
/***/ (function(module, exports) {

module.exports = require("@angular/platform-browser/animations");

/***/ }),
/* 36 */
/***/ (function(module, exports) {

module.exports = require("@angular/common/http");

/***/ }),
/* 37 */
/***/ (function(module, exports) {

module.exports = require("@angular/http");

/***/ }),
/* 38 */
/***/ (function(module, exports) {

module.exports = require("@angular/animations");

/***/ }),
/* 39 */
/***/ (function(module, exports) {

module.exports = require("@angular/platform-browser");

/***/ }),
/* 40 */
/***/ (function(module, exports) {

module.exports = require("@angular/common");

/***/ })
/******/ ]);