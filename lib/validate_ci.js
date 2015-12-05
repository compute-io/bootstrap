'use strict';

// MODULES //

var isObject = require( 'validate.io-object' ),
	isString = require( 'validate.io-string-primitive' ),
	isArrayLike = require( 'validate.io-array-like' );


// VALIDATE //

/**
* FUNCTION validate( opts, options )
*	Validates function options.
*
* @param {Object} opts - destination for validated options
* @param {Object} options - function options
* @param {String} [options.type] - type of confidence interval to calculate
* @param {Number} [options.alpha] - significance level
* @param {Array} [options.variance] - variance estimates for each bootstrap sample
* @returns {Null|Error} null or an error
*/
function validate( opts, options ) {
	if ( !isObject( options ) ) {
		return new TypeError( 'invalid input argument. Options argument must be an object. Value: `' + options + '`.' );
	}
	if ( options.hasOwnProperty( 'alpha' ) ) {
		opts.alpha = options.alpha;
		if ( opts.alpha <= 0 || opts.alpha >= 1  ) {
			return new TypeError( 'invalid option. Alpha option must be a number between 0 and 1. Option: `' + opts.alpha + '`.' );
		}
	}
	if ( options.hasOwnProperty( 'type' ) ) {
		opts.type = options.type;
		if ( !isString( opts.type ) ) {
			return new TypeError( 'invalid option. Type option must be a string. Option: `' + opts.type + '`.' );
		}
	}
	if ( options.hasOwnProperty( 'variance' ) ) {
		opts.variance = options.variance;
		if ( !isArrayLike( opts.variance ) ) {
			return new TypeError( 'invalid option. Variance option must an array of variances. Option: `' + opts.variance + '`.' );
		}
	}
	return null;
} // end FUNCTION validate()

// EXPORTS //

module.exports = validate;
