'use strict';

// MODULES //

var sample = require( 'compute-sample' ),
	incrspace = require( 'compute-incrspace' ),
	mean = require( 'compute-mean' ),
	stdev = require( 'compute-stdev' ),
	isArrayLike = require( 'validate.io-array-like' ),
	isMatrixLike = require( 'validate.io-matrix-like' ),
	toMatrix = require( 'compute-to-matrix' ),
	isFunction = require( 'validate.io-function' ),
	isNumber = require( 'validate.io-number-primitive' );


// FUNCTIONS //

var attachProperties = require( './attachProperties.js' ),
	BootstrapOutput = require( './BootstrapOutput.js' ),
	pickResult = require( './pickResult.js' ),
	validate = require( './validate.js' );


// BOOTSTRAP //

/**
* FUNCTION bootstrap( x, stat, r[, opts] )
*	Generate bootstrap replications of sample statistics.
*
* @param {Matrix|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} x - input data
* @param {Function} statFun - callback function to calculate the statistic(s) of interest
* @param {Number} r - number of boostrap replications
* @param {Object} opts - function options
* @param {Number} [opts.seed] - integer-valued seed
* @returns{Object|Array} bootstrap output(s) for statistic(s) of interest
*/
function bootstrap( x, statFun, r, options ) {
	var opts = {},
		err,
		bootSample,
		msg,
		tBoot, tBootMat,
		sds, means,
		nrow, ids,
		tHat,
		ret,
		i;

	if ( arguments.length < 3 ) {
		msg = 'invalid number of arguments. Musst supply data, function to calculate the statistic of interest and the number of bootstrap replications.';
		throw new Error( msg );
	}
	if ( arguments.length > 3 ) {
		err = validate( opts, options );
		if ( err ) {
			throw err;
		}
	}
	if ( !isFunction( statFun ) ) {
		throw new TypeError( 'invalid argument. Second argument must be a function to calculate the statistic(s) of interest. Value: `' + statFun + '`' );
	}
	if ( !isNumber( r ) ) {
		throw new TypeError( 'invalid argument. Third argument must be a number primitive. Value: `' + r + '`' );
	}

	if ( opts.seed ) {
		sample.seed = opts.seed;
	}

	tHat = statFun( x );
	tBoot = new Array( r );
	for ( i = 0; i < r; i++ ) {
		if ( isMatrixLike( x ) ) {
			nrow = x.shape[ 0 ];
			ids = sample( incrspace( 0, nrow ) );
			bootSample = x.mget( ids );
			tBoot[ i ] = statFun( bootSample );
		} else if ( isArrayLike( x ) ) {
			bootSample = sample( x );
			tBoot[ i ] = statFun( bootSample );
		}
	}
	if ( isArrayLike( tHat ) ) {
		tBootMat = toMatrix( tBoot );
		sds = stdev( tBootMat, {dim: 1} ).data;
		means = mean( tBootMat, {dim: 1} ).data;
		ret = [];
		for ( i = 0; i < tHat.length; i++ ) {
			var o = new BootstrapOutput( tHat[ i ], sds[ i ], means[ i ] - tHat[ i ] );
			attachProperties( o, tBootMat.mget( null, [i] ).data, pickResult( statFun, i ), x );
			ret[ i ] = o;
		}
	} else {
		ret = new BootstrapOutput( tHat, stdev( tBoot ), mean( tBoot ) - tHat );
		attachProperties( ret, tBoot, statFun, x );
	}
	return ret;
} // end FUNCTION bootstrap()


// EXPORTS //

module.exports = bootstrap;

module.exports.ci = require( './ci.js' );
