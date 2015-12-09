/* global require, describe, it */
'use strict';

// MODULES //

var chai = require( 'chai' ),
	bootstrap = require( './../lib' ),
	mean = require( 'compute-mean' ),
	variance = require( 'compute-variance' ),
	skewness = require( 'compute-skewness' ),
	rNormal = require( 'distributions-normal-random' );


// VARIABLES //

var expect = chai.expect,
	assert = chai.assert;


// TESTS //

describe( 'compute-bootstrap', function tests() {

	it( 'should export a function', function test() {
		expect( bootstrap ).to.be.a( 'function' );
	});

	it( 'should throw an error if provided less than three arguments', function test() {
		expect( badValue() ).to.throw( Error );
		function badValue() {
			return function() {
				bootstrap( [1,2,3,4,5,6], function(dat){ return mean(dat); } );
			};
		}
	});

	it( 'should throw an error if the second argument is not a function', function test() {
		var values = [
			'a',
			5,
			true,
			undefined,
			null,
			NaN,
			[],
			{}
		];

		for ( var i = 0; i < values.length; i++ ) {
			expect( badValue( values[ i ] ) ).to.throw( TypeError );
		}
		function badValue( value ) {
			return function() {
				bootstrap( [1,2,3,4,5,6], value, value );
			};
		}
	});

	it( 'should throw an error if the third argument is not a number', function test() {
		var values = [
			'5',
			true,
			undefined,
			null,
			NaN,
			function(){},
			[],
			{}
		];

		for ( var i = 0; i < values.length; i++ ) {
			expect( badValue( values[ i ] ) ).to.throw( TypeError );
		}
		function badValue( value ) {
			return function() {
				bootstrap( [1,2,3,4,5,6], function(dat){ return mean(dat); }, value );
			};
		}
	});

	it( 'should return an object with properties `original`, `bias` and `stdev` for a single statistic', function test() {
		var data = rNormal( 100, { mu: 4, sigma: 2 } ),
			r = 1000,
			out;

		out =  bootstrap( data, mean, r );

		assert.isObject( out );
		assert.property( out, 'original' );
		assert.property( out, 'bias' );
		assert.property( out, 'stdev' );
	});

	it( 'should return an object with `ci` method to calculate confidence intervals for a single statistic', function test() {
		var data = rNormal( 100, { mu: 4, sigma: 2 } ),
			r = 1000,
			out;

		out =  bootstrap( data, mean, r );

		assert.isFunction( out.ci );

	});

	it( 'should return an array of objects with properties `original`, `bias` and `stdev` for multiple statistics', function test() {
		var data = rNormal( 100, { mu: 4, sigma: 2 } ),
			r = 1000,
			out;

		out =  bootstrap( data, function bootStats( dat ) {
			return [ variance( dat ), skewness( dat ) ];
		}, r );

		assert.isArray( out );
		for ( var i = 0; i < out.length; i++ ) {
			assert.isObject( out[ i ] );
			assert.property( out[ i ], 'original' );
			assert.property( out[ i ], 'bias' );
			assert.property( out[ i ], 'stdev' );
		}
	});


});
