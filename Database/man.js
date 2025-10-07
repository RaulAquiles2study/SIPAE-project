import CONSTANTS from "./CONSTANTS.js";
import database from "./database.js";
import bcrypt from 'bcrypt';
await database.transaction(async trx=>{
    const users = await database('users').transacting(trx);
    for (const user of users){
        await trx('users').update({nome:user.nome.trim(),email:user.email.trim()}).where('UID',user.UID)
    }
})

console.log('bleh');
