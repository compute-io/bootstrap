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
	pickResult = require( './pickResult.js' );


// BOOTSTRAP //

/**
* FUNCTION bootstrap( x, stat, r )
*	Generate bootstrap replications of sample statistics.
*
* @param {Matrix|Array|Int8Array|Uint8Array|Uint8ClampedArray|Int16Array|Uint16Array|Int32Array|Uint32Array|Float32Array|Float64Array} x - input data
* @param {Function} statFun - callback function to calculate the statistic(s) of interest
* @param {Number} r - number of boostrap replications
*/
function bootstrap( x, statFun, r ) {
	var bootSample,
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
	if ( !isFunction( statFun ) ) {
		throw new TypeError( 'invalid argument. Second argument must be a function to calculate the statistic(s) of interest. Value: `' + statFun + '`' );
	}
	if ( !isNumber( r ) ) {
		throw new TypeError( 'invalid argument. Third argument must be a number primitive. Value: `' + r + '`' );
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
			var o = {};
			o.original = tHat[ i ];
			o.stdev = sds[ i ];
			o.bias = means[ i ] - o.original;
			attachProperties( o, tBootMat.mget( null, [i] ).data, pickResult( statFun, i ), x );
			ret[ i ] = o;
		}
	} else {
		ret = {};
		ret.original = tHat;
		ret.stdev = stdev( tBoot );
		ret.bias = mean( tBoot ) - ret.original;
		attachProperties( ret, tBoot, statFun, x );
	}
	return ret;
} // end FUNCTION bootstrap()


// EXPORTS //

module.exports = bootstrap;
