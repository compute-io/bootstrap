'use strict';

var bootstrap = require( './../lib' ),
	median = require( 'compute-median' ),
	variance = require( 'compute-variance' ),
	skewness = require( 'compute-skewness' ),
	rNorm = require( 'distributions-normal-random' ),
	data,
	out,
	ci;

// Bootstrap for sample median:

data = rNorm( 1000 );
out = bootstrap( data, median, 500 );

// Calculate different confidence intervals:

ci = bootstrap.ci( out, { type: 'bca', level: 0.95 } );
console.log( ci );
ci = bootstrap.ci( out, { type: 'percentile', level: 0.95 } );
console.log( ci );
ci = bootstrap.ci( out, { type: 'basic', level: 0.95 } );
console.log( ci );
ci = bootstrap.ci( out, { type: 'normal', level: 0.95 });
console.log( ci );

// Bootstrap for multiple statistics at once:

data = rNorm( 1000 );
out = bootstrap( data, function( d ) {
	return [ skewness( d ), variance( d ) ];
}, 500 );
console.log( out );
