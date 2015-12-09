'use strict';

// MODULES //

var sum = require( 'compute-sum' ),
	lt = require( 'compute-lt' ),
	normCDF = require( 'distributions-normal-cdf' ),
	normQ = require( 'distributions-normal-quantile' ),
	incrspace = require( 'compute-incrspace' ),
	subtract = require( 'compute-subtract' ),
	divide = require( 'compute-divide' ),
	quantile = require( 'compute-quantile' ),
	pow = require( 'compute-power' ),
	isArrayLike = require( 'validate.io-array-like' ),
	isMatrixLike = require( 'validate.io-matrix-like' );


// FUNCTIONS //

var validate = require( './validate_ci.js' );


// GET CI //

/**
* FUNCTION ci( opts )
*	Generates a two-sided non-parametric confidence interval.
*
* @param {String} [opts.type='basic'] - type of confidence interval to calculate
* @param {Number} [opts.alpha=0.05] - significance level
* @param {Array} [opts.variance] - variance estimates for each bootstrap sample
* @returns {Array} confidence interval
*/
function ci( options ) {
	/*jshint validthis:true */
	var opts = {},
		err,
		type, alpha,
		tBoot = this.realizations,
		n = tBoot.length,
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
		x = this.data;
		// Using Equation 6.7 in [1] to calculate u_i via jackknife estimator...
		if ( isMatrixLike( x ) ) {
			// Case A: when x is a matrix...
			for ( i = 0; i < n; i++ ) {
				ids = incrspace( 0, n, 1 ).splice( i, 1 );
				x_noti = x.mget( ids );
				u[ i ] =  tHat - this.statFun( x_noti );
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
				u[ i ] =  tHat - this.statFun( x_noti );
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
} // end FUNCTION ci()


// EXPORTS //

module.exports = ci;
