/**
 *
 *    Copyright (c) 2021 Silicon Labs
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

/**
 * This module contains the API functions for the post-load
 * scripting functionality.
 */
const queryEndpoint = require('../db/query-endpoint.js')

/**
 * Prints a text to console.
 *
 * @param {*} text
 */
function print(text) {
  console.log(text)
}

/**
 * Returns an array of endpoints.
 *
 * @param {*} context
 */
function endpoints(context) {}

/**
 * Returns array of function names available in this module.
 */
function functions() {
  return Object.keys(exports)
}

/**
 * Returns the session id in the context.
 *
 * @param {*} context
 * @returns sessionId
 */
function sessionId(context) {
  return context.sessionId
}

exports.print = print
exports.functions = functions
exports.sessionId = sessionId
