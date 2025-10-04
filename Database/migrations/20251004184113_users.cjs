/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
 return knex.schema.createTable('users',table=>{
  table.increments('UID').primary().notNullable();
  table.string('nome').notNullable();
  table.string('email').notNullable();
  table.string('senha').notNullable();
  table.integer('rank').defaultTo(1);
 })
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
 return knex.schema.dropTable('users');
};
