'use strict';

// MODULES //

var sum = require( 'compute-sum' ),
	lt = require( 'compute-lt' ),
	normCDF = require( 'distributions-normal-cdf' ),
	normQ = require( 'distributions-normal-quantile' ),
	incrspace = require( 'compute-incrspace' ),
	subtract = require( 'compute-subtract' ),
	sqrt = require( 'compute-sqrt' ),
	divide = require( 'compute-divide' ),
	quantile = require( 'compute-quantile' ),
	pow = require( 'compute-power' ),
	isArrayLike = require( 'validate.io-array-like' ),
	isMatrixLike = require( 'validate.io-matrix-like' );


// FUNCTIONS //

var BootstrapOutput = require( './BootstrapOutput.js' ),
	validate = require( './validate_ci.js' );


// GET CI //

/**
* FUNCTION ci( out, opts )
*	Generates a two-sided non-parametric confidence interval for the supplied boostrapped statistic.
*
* @param {Object|Array} out - bootstrap output or array of bootstrap outputs
* @param {String} [opts.type='basic'] - type of confidence interval to calculate
* @param {Number} [opts.level=0.95] - confidence level
* @param {Array} [opts.variance] - variance estimates for each bootstrap sample
* @returns {Array} confidence interval
*/
function ci( out, options ) {
	var opts = {},
		err,
		type, alpha,
		tBoot = out.realizations,
		n = tBoot.length,
		ret,
		x,
		cis,
		zbs,
		z0,
		zl,
		zu,
		plower, pupper,
		accel,
		x_noti, ids,
		i, j,
		u = new Float64Array( n ),
		tHat = out.original;

	if ( arguments.length < 1 ) {
		throw new Error( 'insufficient number of arguments. First argument must be a bootstrap output or an array of bootstrap outputs. Value: `' + out + '`' );
	}
	if ( isArrayLike( out ) ) {
		ret = new Array( out.length );
		for ( i = 0; i < out.length; i++ ) {
			ret[ i ] = ci( out[ i ], options );
		}
		return ret;
	}
	if ( out instanceof BootstrapOutput === false ) {
		throw new TypeError( 'invalid input argument. First argument must be an output returned from the boostrap function or an array of such outputs. Value: `' + out + '`' );
	}
	if ( arguments.length > 1 ) {
		err = validate( opts, options );
		if ( err ) {
			throw err;
		}
	}
	type = opts.type || 'bca';
	alpha = opts.level ? 1 - opts.level : 0.05;

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
		x = out.data;
		// Using Equation 6.7 in [1] to calculate u_i via jackknife estimator...
		if ( isMatrixLike( x ) ) {
			// Case A: when x is a matrix...
			for ( i = 0; i < n; i++ ) {
				ids = incrspace( 0, n, 1 ).splice( i, 1 );
				x_noti = x.mget( ids );
				u[ i ] =  tHat - out.statFun( x_noti );
			}
		} else {
			// Case B: When x is an array...
			for ( i = 0; i < n; i++ ) {
				x_noti = [];
				for ( j = 0; j < n; j++ ) {
					if ( j !== i ) {
						x_noti.push( x[ j ] );
					}
				}
				u[ i ] =  tHat - out.statFun( x_noti );
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
			tHat - out.bias - zu * out.stdev,
			tHat - out.bias + zu * out.stdev
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
		zbs = divide( subtract( tBoot, tHat ), sqrt( opts.variance ) );
		cis = [
			tHat - quantile( zbs, 1 - alpha / 2 ) * out.stdev,
			tHat - quantile( zbs, alpha / 2 ) * out.stdev
		];
	break;
	default:
		throw new TypeError( 'Unknown Type option supplied. Value: `' + type + '`' );
	}
	return cis;
} // end FUNCTION ci()


// EXPORTS //

module.exports = ci;
