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
 .createTable('users',table=>{
  table.increments('UID').primary().notNullable();
  table.string('nome').notNullable();
  table.string('email').notNullable();
  table.string('senha').notNullable();
  table.integer('rank').defaultTo(1);
 })
 .createTable('useRegister',table=>{
  table.increments('ID').primary().notNullable();
  table.string('user').notNullable();
  table.string('useremail').notNullable();
  table.string('acao').notNullable();
  table.dateTime('data').notNullable();
 })
 .createTable('manutencaoLinks',table=>{
  table.increments('ID').primary();
  table.integer('objetoID').notNullable();
  table.integer('manutencaoID').notNullable();
 })
 .createTable('manutencoes',table=>{
  table.increments('ID').primary();
  table.boolean('concluido').defaultTo(false);
  table.date('data').notNullable();
  table.date('retornoEsperado').notNullable();
  table.float('valor').notNullable();
  table.float('tipoObjetoID').notNullable();
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
  .dropTable('setores')
  .dropTable('useRegister')
  .dropTable('manutencoes')
  .dropTable('manutencaoLinks')
};