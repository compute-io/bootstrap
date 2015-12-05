'use strict';

var bootstrap = require( './../lib' ),
	median = require( 'compute-median' ),
	variance = require( 'compute-variance' ),
	skew = require( 'compute-skewness' ),
	randomNormal = require( 'distributions-normal-random' ),
	data,
	out,
	cis;

// Bootstrap for sample median:

data = randomNormal( 1000 );
out = bootstrap( data, function( d ) {
	return median( d );
}, 500 );

// Calculate different confidence intervals:

cis = out.ci( { type: 'bca', alpha: 0.05 } );
console.log( cis );
cis = out.ci( { type: 'percentile', alpha: 0.05 } );
console.log( cis );
cis = out.ci( { type: 'basic', alpha: 0.05 } );
console.log( cis );
cis = out.ci( { type: 'normal', alpha: 0.05 });
console.log( cis );


// Bootstrap for multiple statistics at once:

data = randomNormal( 1000 );
out = bootstrap( data, function( d ) {
	return [ skew( d ), variance( d ) ];
}, 500 );
console.log( out );
