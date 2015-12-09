'use strict';

/**
* FUNCTION: pickResult( fcn, idx )
*	Creates a function which picks element of array returned by supplied function
*
* @param {Function} fcn - input function
* @param {Number} idx - index in result array
* @returns {Function} function returning the `idx`-th element of output array from `fcn`
*/
function pickResult( fcn, idx ) {
	return function picked() {
		var out = fcn.apply( this, arguments );
		return out[ idx ];
	};
} // end FUNCTION pickResult()


// EXPORTS //

module.exports = pickResult;
