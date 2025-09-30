/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
 await knex.schema
 .createTable('setores',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Novo Setor');
 })
 await knex.schema
 .createTable('subSetores',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Novo Subsetor');
  table.integer('sid').notNullable().references('ID').inTable('setores').onDelete('CASCADE')
 })
 await knex.schema
 .createTable('tipoObjetos',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Nova Categoria');
  table.integer('sid').references('ID').inTable('setores').onDelete('CASCADE');
  table.integer('suid').references('ID').inTable('subSetores').onDelete('CASCADE');
  table.string('customData').defaultTo('');
 })
 await knex.schema
 .createTable('objetos',table=>{
  table.increments('ID').primary().notNullable();
  table.integer('tid').notNullable().references('ID').inTable('tipoObjetos').onDelete('CASCADE');
  table.integer('estado').notNullable().defaultTo(0);
  table.float('custo').notNullable().defaultTo(0);
  table.string('customData').defaultTo('');
 })
 await knex.schema
 .createTable('users',table=>{
  table.increments('UID').primary().notNullable();
  table.string('nome').notNullable();
  table.string('email').notNullable();
  table.string('senha').notNullable();
  table.integer('rank').defaultTo(1);
 });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema
  .dropTable('users')
  .dropTable('objetos')
  .dropTable('tipoObjetos')
  .dropTable('subSetores')
  .dropTable('setores');
};
