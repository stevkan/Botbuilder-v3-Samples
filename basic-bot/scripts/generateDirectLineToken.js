const fetch = require('fetch');
const createUserID = require('./createUserID');

const {
  DIRECT_LINE_URL = 'https://directline.botframework.com/'
} = process.env

module.exports = async function ( userID ) {
  const {
    directLineSecret
  } = process.env;

  userID || ( userID = await createUserID() );
  console.log( `Generating Direct Line token using secret "${ directLineSecret.substr( 0, 3 ) }...${ directLineSecret.substr( -3 ) }" and user ID "${ userID }"` );

  let cres;
  cres = await fetch( `${ DIRECT_LINE_URL }v3/directline/tokens/generate`, {
    // body: JSON.stringify( {
    //   User: {
    //     Id: userID
    //   }
    // } ),
    headers: {
      'Authorization': `Bearer ${ directLineSecret }`,
      'Content-Type': 'application/json'
    },
    method: 'POST'
  } );

  if ( cres.status === 200 ) {
    const json = await cres.json();
    if ( 'error' in json ) {
      throw new Error( `Direct Line service responded ${ JSON.stringify( json.error ) } while generating new token` );
    } else {
      return {
        ...json
      };
    }
  } else {
    throw new Error( `Direct Line service returned ${ cres.status } while generating new token` );
  }
}
