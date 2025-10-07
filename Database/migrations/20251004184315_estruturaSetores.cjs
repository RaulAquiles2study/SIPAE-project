/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
 return knex.schema.createTable('setores',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Novo Setor');
 })
 .createTable('subSetores',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Novo Subsetor');
  table.integer('sid').notNullable().references('ID').inTable('setores').onDelete('CASCADE')
 })
 .createTable('tipoObjetos',table=>{
  table.increments('ID').primary().notNullable();
  table.string('name').notNullable().defaultTo('Nova Categoria');
  table.integer('sid').references('ID').inTable('setores').onDelete('CASCADE');
  table.integer('suid').references('ID').inTable('subSetores').onDelete('CASCADE');
  table.string('customData').defaultTo('');
 })
 .createTable('objetos',table=>{
  table.increments('ID').primary().notNullable();
  table.integer('tid').notNullable().references('ID').inTable('tipoObjetos').onDelete('CASCADE');
  table.integer('estado').notNullable().defaultTo(0);
  table.float('valor').notNullable().defaultTo(0);
  table.string('customData').defaultTo('');
 })
};
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
 return knex.schema
  .dropTable('objetos')
  .dropTable('tipoObjetos')
  .dropTable('subSetores')
  .dropTable('setores')
};
