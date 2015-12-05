'use strict';

// MODULES //

var sample = require( 'compute-sample' ),
	subtract = require( 'compute-subtract' ),
	divide = require( 'compute-divide' ),
	incrspace = require( 'compute-incrspace' ),
	mean = require( 'compute-mean' ),
	pow = require( 'compute-power' ),
	stdev = require( 'compute-stdev' ),
	sum = require( 'compute-sum' ),
	lt = require( 'compute-lt' ),
	normCDF = require( 'distributions-normal-cdf' ),
	normQ = require( 'distributions-normal-quantile' ),
	isArrayLike = require( 'validate.io-array-like' ),
	isMatrixLike = require( 'validate.io-matrix-like' ),
	toMatrix = require( 'compute-to-matrix' ),
	quantile = require( 'compute-quantile' );


// FUNCTIONS //

var validate = require( './validate_ci.js' );


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
		n = x.length,
		tBoot, tBootMat,
		sds, means,
		nrow, ids,
		tHat,
		ret,
		i;

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
			Object.defineProperty( o, 'ci', {
				enumerable: false,
				configurable: false,
				writable: false,
				value: getCI( tBootMat.mget( null, [i] ).data, i )
			});
			ret[ i ] = o;
		}
	} else {
		ret = {};
		ret.original = tHat;
		ret.stdev = stdev( tBoot );
		ret.bias = mean( tBoot ) - ret.original;
		Object.defineProperty( ret, 'ci', {
			enumerable: false,
			configurable: false,
			writable: false,
			value: getCI( tBoot )
		});
	}
	return ret;
	/**
	* FUNCTION: getCI( tBoot, idx )
	*	Returns CI function to attach to boostrap object.
	*
	* @param {Number} tBoot - index in return array
	* @param {Number} [idx=undefined] - index of statistic in array returned by supplied statFun.
	* @returns {Void}
	*/
	function getCI( tBoot, idx ) {
		/**
		* FUNCTION ci( opts )
		*	Generates a two-sided non-parametric confidence interval.
		*
		* @param {String} [opts.type='basic'] - type of confidence interval to calculate
		* @param {Number} [opts.alpha=0.05] - significance level
		* @param {Array} [opts.variance] - variance estimates for each bootstrap sample
		* @returns {Array} confidence interval
		*/
		return function ci( options ) {
			var opts = {},
				err,
				type, alpha,
				cis,
				zbs,
				z0,
				zl,
				zu,
				plower, pupper,
				accel,
				x_noti,
				i, j,
				u = new Float64Array( n ),
				tHat = this.original;

			if ( arguments.length > 0 ) {
				err = validate( opts, options );
				if ( err ) {
					throw err;
				}
			}
			type = opts.type || 'basic';
			alpha = opts.alpha || 0.05;

			switch ( type ) {
			case 'basic':
				cis = [
					2 * tHat - quantile( tBoot, 1 - alpha / 2 ),
					2 * tHat - quantile( tBoot, alpha / 2 )
				];
			break;
			case 'bca':
				/*
					REFERENCES:
						[1] DiCiccio, T., & Efron, B. (1996). Bootstrap confidence intervals.
						Statistical Science, 11(3), 189–228.
						Retrieved from http://www.jstor.org/stable/10.2307/2246110
						[2] Efron, B. (1987). Better bootstrap confidence intervals.
						Journal of the American Statistical Association,
						82(397), 171–185. doi:10.2307/2289144
				*/
				zl = normQ( alpha/2 );
				zu = normQ( 1-alpha/2 );
				// Using Equation 6.7 in [1] to calculate u_i via jackknife estimator...
				if ( idx ) {
					// Case A: When statFun returns an array...
					for ( i = 0; i < n; i++ ) {
						x_noti = [];
						for ( j = 0; j < n; j++ ) {
							if ( j !== i ) {
								x_noti.push( x[ j ] );
							}
						}
						u[ i ] =  tHat - statFun( x_noti )[ idx ];
					}
				} else {
					// Case B: When statFun returns a scalar...
					for ( i = 0; i < n; i++ ) {
						x_noti = [];
						for ( j = 0; j < n; j++ ) {
							if ( j !== i ) {
								x_noti.push( x[ j ] );
							}
						}
						u[ i ] =  tHat - statFun( x_noti );
					}
				}
				// Equation 6.6 in [1] for acceleration:
				accel = (1/6) * sum( pow( u, 3 ) ) / pow( sum( pow( u, 2 ) ), 3/2 );
				// Equation 2.8 to calculate bias-correction term [1]:
				z0 = normQ( sum( lt( tBoot, tHat ) ) / tBoot.length );
				// Interval Endpoints (Equation 2.6 in [2])
				plower = normCDF( z0 + ( z0 + zl ) / ( 1 - accel * ( z0 + zl ) ) );
				pupper = normCDF(z0 + ( z0 + zu ) / ( 1 - accel * ( z0 + zu ) ) );
				cis = [
					quantile( tBoot, plower ),
					quantile( tBoot, pupper )
				];
			break;
			case 'normal':
				zl = normQ( alpha/2 );
				zu = normQ( 1-alpha/2 );
				cis = [
					tHat - this.bias - zu * this.stdev,
					tHat - this.bias + zu * this.stdev
				];
			break;
			case 'percentile':
				cis = [
					quantile( tBoot, alpha / 2 ),
					quantile( tBoot, 1 - alpha / 2)
				];
			break;
			case 'studentized':
				if ( !isArrayLike( opts.variance ) ) {
					throw new TypeError( 'Bootstrapped variances have to be supplied in order to calculate studentized CI.' );
				}
				zbs = divide( subtract( tBoot, tHat ), opts.variance );
				cis = [
					tHat - quantile( zbs, 1 - alpha / 2 ) * this.stdev,
					tHat - quantile( zbs, alpha / 2 ) * this.stdev
				];
			break;
			default:
				throw new TypeError( 'Unknown Type option supplied.' );
			}
			return cis;
		}; // end FUNCTION ci()
	} // end FUNCTION attachCI()
} // end FUNCTION bootstrap()


// EXPORTS //

module.exports = bootstrap;
