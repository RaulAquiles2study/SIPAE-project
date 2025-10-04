/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
 await knex.schema
 .createTable('useRegister',table=>{
  table.increments('ID').primary().notNullable();
  table.string('user').notNullable();
  table.string('useremail').notNullable();
  table.string('acao').notNullable();
  table.dateTime('data').notNullable();
 })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema
  .dropTable('useRegister')
};