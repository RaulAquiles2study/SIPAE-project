import CONSTANTS from "./CONSTANTS.js";
import database from "./database.js";
import bcrypt from 'bcrypt';

await database('users').update({rank:5}).where('UID', 1)

console.log('bleh');
