'use strict';

// MODULES //

var copy = require( 'utils-copy' );


// FUNCTIONS //

var ci = require( './ci.js' );


// ATTACH PROPERTIES //

/**
* FUNCTION: attachProperties( obj, tBoot, statFun )
*	Attach properties to returned bootstrap object.
*
* @param {Object} obj - bootstrap object
* @param {Array|Matrix} tBoot - realizations of statistic(s) of interest
* @param {Function} statFun - callback function used to calculate the statistic(s) of interest
* @param {Matrix|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} x - original data
* @returns {Void}
*/
function attachProperties( obj, tBoot, statFun, x ) {
	Object.defineProperty( obj, 'ci', {
		enumerable: false,
		configurable: false,
		writable: false,
		value: ci
	});
	Object.defineProperty( obj, 'realizations', {
		enumerable: false,
		get: function get() {
			return copy( tBoot );
		}
	});
	Object.defineProperty( obj, 'statFun', {
		enumerable: false,
		get: function get() {
			return statFun;
		}
	});
	Object.defineProperty( obj, 'data', {
		enumerable: false,
		get: function get() {
			return copy( x );
		}
	});
} // end FUNCTION attachProperties()


// EXPORTS //

module.exports = attachProperties;
