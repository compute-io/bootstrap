bootstrap
===
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependencies][dependencies-image]][dependencies-url]

> Bootstrap resampling utilities.


## Installation

``` bash
$ npm install compute-bootstrap
```


## Usage

``` javascript
var bootstrap = require( 'compute-bootstrap' );
```

#### bootstrap( x, stat, r[, opts] )

Given input data in form of a [`matrix`](https://github.com/dstructs/matrix) or [`array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) / [`typed array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), this function generates bootstrap replications for the statistic(s) of interest as specified by the given `stat` function. The `r` argument denotes the number of bootstrap replications that should be generated. For each replication, `stat` will be invoked with the respective bootstrap sample passed as the first argument. If you wish to use the bootstrap for multiple statistics at once, the supplied `stat` function should return an array holding the individual statistics. For each statistic, the function returns an object with three properties:
* 	__original__: the statistic calculated for the original data set contained in `x`
* 	__stdev__: the bootstrap estimate of the standard error of the statistic
*	__bias__: the difference between `original` and the bootstrap estimate of the mean for the statistic of interest, i.e. its sample mean calculated over all bootstrap replications

``` javascript
var data,
	median = require( 'compute-median' ),
	variance = require( 'compute-variance' ),
	out;

data = [
	3, 5, 8, 9, 1, 2, 12, 3, 22, 4, 8,
	12, 15, 18, 12, 7, 6, 4, 2, 0, 0, 1,
	3, 17, 5, 2, 19, 7, 17, 16
];

out = bootstrap( data, median, 1000, { seed: 22 } ;
/*
	{
		original: 6.5,
		stdev: 1.7594563611202991,
		bias: -0.15299999999999248
	}
*/

out = bootstrap( data, function( d ) {
	return [ median( d ), variance( d ) ];
}, 1000, { seed: 22 } );
/*
	[
		{
			original: 6.5,
			stdev: 1.7594563611202991,
			bias: -0.15299999999999248
		},
		{
			original: 41.58620689655172,
			stdev: 8.150566944052263,
			bias: -1.0566954022988782
		}
	]
*/
```

The function accepts the following `options`:

*	__seed__: positive integer used as a seed to initialize the random number generator for creating the bootstrap replications.

The [`object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) returned by the `bootstrap` function (or the [`array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) elements in the case of multiple statistics) contains also
non-enumerable properties `realizations`, `data` and `statFun`, which contain the realizations of the statistic for each bootstrap sample, the original data and the function used to calculate the statistic, respectively.

The package exports a function to calculate confidence intervals, which is described next.

#### .ci( out[, opts] )

With the `ci` function, one can construct confidence intervals. The `out` argument can be either a single output object or an [`array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of output objects returned from `bootstrap`.

``` javascript
var rNorm = require( 'distributions-normal-random' ),
	data = rNorm( 1000, { mu: 3, sigma: 2, seed: 7 } ),
	out,
	ci;

out = bootstrap( data, median, 1000, { seed: 19 } );

// 95% CI for the median (using BCA method):
ci = bootstrap.ci( out )
// returns [ ~2.735, ~3.030 ]
```

The function accepts the following `options`:

*	__type__: [`string`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) denoting the type of confidence interval to create. Possible values are `basic`, `bca`, `normal`, `percentile` and `studentized`. Default: `bca`.
*	__level__: [`number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) specifying confidence level of the interval. Default: `0.95`.
*	__variance__: If `type` is `studentized`, it is required to provide an [`array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) of estimates for the variance of the statistic in question at each bootstrap replication.

To calculate a confidence interval of a different type, use the `type` option:

``` javascript
ci = bootstrap.ci( out, { type: 'percentile' } );
// returns [ ~2.735, ~3.030 ]
```
See the corresponding [Wikipedia article](https://en.wikipedia.org/wiki/Bootstrapping_%28statistics%29#Methods_for_bootstrap_confidence_intervals) for an explanation of the various types.

To set the significance level to a different value than `0.95`, use the `level` option:

``` javascript
bootstrap.ci( out, { level: 0.9 } )
// returns [ ~2.773, ~3.022 ]
```

If `type` is set to `studentized`, we need to supply a vector of variances for the `bootstrapped statistic at each bootstrap replication.

``` javascript
var mean = require( 'compute-mean' ),
	variance = require( 'compute-variance' );

out = bootstrap( data, function( d ) {
	var n = d.length;
	return [ mean( d ), variance( d ) / n ]
}, 500, { seed: 15 } );

bootstrap.ci( out[ 0 ], {
	type: 'studentized',
	variance: out[ 1 ].realizations
})
// returns [ ~2.978, ~3.074 ]
```

## Examples

``` javascript
var bootstrap = require( 'compute-bootstrap' ),
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
ci = bootstrap.ci( out, { type: 'percentile', level: 0.95 } );
ci = bootstrap.ci( out, { type: 'basic', level: 0.95 } );
ci = bootstrap.ci( out, { type: 'normal', level: 0.95 });

// Bootstrap for multiple statistics at once:
data = randomNormal( 1000 );
out = bootstrap( data, function( d ) {
	return [ skewness( d ), variance( d ) ];
}, 500 );
```

To run the example code from the top-level application directory,

``` bash
$ node ./examples/index.js
```


## Tests

### Unit

Unit tests use the [Mocha][mocha] test framework with [Chai][chai] assertions. To run the tests, execute the following command in the top-level application directory:

``` bash
$ make test
```

All new feature development should have corresponding unit tests to validate correct functionality.


### Test Coverage

This repository uses [Istanbul][istanbul] as its code coverage tool. To generate a test coverage report, execute the following command in the top-level application directory:

``` bash
$ make test-cov
```

Istanbul creates a `./reports/coverage` directory. To access an HTML version of the report,

``` bash
$ make view-cov
```


---
## License

[MIT license](http://opensource.org/licenses/MIT).


## Copyright

Copyright &copy; 2015. The [Compute.io](https://github.com/compute-io) Authors.


[npm-image]: http://img.shields.io/npm/v/compute-bootstrap.svg
[npm-url]: https://npmjs.org/package/compute-bootstrap

[travis-image]: http://img.shields.io/travis/compute-io/bootstrap/master.svg
[travis-url]: https://travis-ci.org/compute-io/bootstrap

[codecov-image]: https://img.shields.io/codecov/c/github/compute-io/bootstrap/master.svg
[codecov-url]: https://codecov.io/github/compute-io/bootstrap?branch=master

[dependencies-image]: http://img.shields.io/david/compute-io/bootstrap.svg
[dependencies-url]: https://david-dm.org/compute-io/bootstrap

[dev-dependencies-image]: http://img.shields.io/david/dev/compute-io/bootstrap.svg
[dev-dependencies-url]: https://david-dm.org/dev/compute-io/bootstrap

[github-issues-image]: http://img.shields.io/github/issues/compute-io/bootstrap.svg
[github-issues-url]: https://github.com/compute-io/bootstrap/issues

[mocha]: http://mochajs.org/
[chai]: http://chaijs.com
[istanbul]: https://github.com/gotwarlost/istanbul
