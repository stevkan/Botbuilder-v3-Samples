const { promisify } = require('util');
const { randomBytes } = require('crypto');

const randomBytesAsync = promisify( randomBytes );

module.exports = async function () {
  const buffer = await randomBytesAsync( 16 );

  console.log(`dl_${ buffer.toString( 'hex' ) }`);
  return `dl_${ buffer.toString( 'hex' ) }`;
}