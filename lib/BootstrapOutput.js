'use strict';

/**
* FUNCTION: BootstrapOutput( original, stdev, bias )
*	Checks whether an input value is a result from the bootstrap function.
*
* @constructor
* @param {Number} original - input value
* @param {Number} stdev - input value
* @param {Number} bias - input value
* @returns {BootstrapOutput} instance
*/
function BootstrapOutput( original, stdev, bias ) {
	this.original = original;
	this.stdev = stdev;
	this.bias = bias;
} // end FUNCTION BootstrapOutput()


// EXPORTS //

module.exports = BootstrapOutput;
