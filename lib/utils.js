'use strict';

var _ = require('lodash');
var chalk = require('chalk');
var Readable = require('stream').Readable;
var RSVP = require('rsvp');

var configstore = require('./configstore');
var FirebaseError = require('./error');
var logger = require('./logger');

var isWindows = process.platform === 'win32';

module.exports = {
  /**
   * Create a Firebase Console URL for the specified path and project.
   * @param {String} project The Project ID for the URL.
   * @param {String} path The console path for the URL.
   */
  consoleUrl: function(project, path) {
    var api = require('./api');
    return api.consoleOrigin + '/project/' + project + path;
  },
  /**
   * Trace up the ancestry of objects that have a `parent` key, finding the
   * first instance of the provided key.
   *
   * @param {Object} options The options object with potential parents.
   * @param {String} key The key for which to look.
   */
  getInheritedOption: function(options, key) {
    var target = options;
    while (target) {
      if (_.has(target, key)) {
        return target[key];
      }
      target = target.parent;
    }
  },
  /**
   * Override a value with supplied environment variable if present.
   *
   * @param {String} envname The environment variable to override.
   * @param {String} value The default value if no env is set.
   * @param {Function} coerce A function that returns the environment
   *   variable in an acceptable format. If this throws an error, the
   *   default value will be used.
   * @returns {String} The fully resolved value
   */
  envOverride: function(envname, value, coerce) {
    if (process.env[envname] && process.env[envname].length) {
      if (coerce) {
        try {
          return coerce(process.env[envname], value);
        } catch (e) {
          return value;
        }
      }
      return process.env[envname];
    }
    return value;
  },

  /**
   * Add a subdomain to the specified HTTP origin.
   * @param {String} origin The HTTP origin (e.g. https://example.com)
   * @param {String} subdomain The subdomain to add
   * @returns {String} The origin for the domain with a subdomain
   */
  addSubdomain: function(origin, subdomain) {
    return origin.replace('//', '//' + subdomain + '.');
  },
  /**
   * Log an info statement with a green checkmark at the start of the line.
   * @param {String} The message to log
   * @param {String} The log type, defaults to 'info'
   */
  logSuccess: function(message, type) {
    type = type || 'info';
    var chr = isWindows ? '+' : '✔';
    logger[type](chalk.green(chr + ' '), message);
  },
  /**
   * Log an info statement with a gray bullet at the start of the line.
   * @param {String} The message to log
   * @param {String} The log type, defaults to 'info'
   */
  logBullet: function(message, type) {
    type = type || 'info';
    logger[type](chalk.cyan.bold('i '), message);
  },
  /**
   * Log an info statement with a gray bullet at the start of the line.
   * @param {String} The message to log
   * @param {String} The log type, defaults to 'info'
   */
  logWarning: function(message, type) {
    type = type || 'warn';
    var chr = isWindows ? '!' : '⚠';
    logger[type](chalk.yellow.bold(chr + ' '), message);
  },
  /**
   * Return a promise that rejects with a FirebaseError.
   * @param {String} message the error message
   * @param {Object} options the error options
   */
  reject: function(message, options) {
    return RSVP.reject(new FirebaseError(message, options));
  },
  /**
   * Print out an explanatory message if a TTY is detected for how to manage STDIN
   */
  explainStdin: function() {
    if (isWindows) {
      throw new FirebaseError('STDIN input is not available on Windows.', {exit: 1});
    }
    if (process.stdin.isTTY) {
      logger.info(chalk.bold('Note:'), 'Reading STDIN. Type JSON data and then press Ctrl-D');
    }
  },
  /**
   * Convert text input to a Readable stream.
   * @param {String} text the text to convert
   * @returns {stream.Readable} the stream
   */
  stringToStream: function(text) {
    if (!text) {
      return undefined;
    }
    var s = new Readable();
    s.push(text);
    s.push(null);
    return s;
  },

  /**
   * Sets the active project alias or id in the specified directory.
   * @param {String} projectDir the project directory
   * @param {String} newActive the new active project alias or id
   */
  makeActiveProject: function(projectDir, newActive) {
    var activeProjects = configstore.get('activeProjects') || {};
    if (newActive) {
      activeProjects[projectDir] = newActive;
    } else {
      _.unset(activeProjects, projectDir);
    }

    configstore.set('activeProjects', activeProjects);
  }
};
