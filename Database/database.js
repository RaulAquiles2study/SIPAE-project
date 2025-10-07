import config from "./knexfile.js";
import knex from "knex";

export default knex({...config.development,pool:{afterCreate:(conn,done)=>{
 conn.run('PRAGMA foreign_keys = ON', (err)=>{done(err,conn)})
}}});