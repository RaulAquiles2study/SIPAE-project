/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
 await knex.schema
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
  table.string('descricao').notNullable();
  table.float('tipoObjetoID').notNullable().references('ID').inTable('tipoObjetos').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  return knex.schema
  .dropTable('manutencoes')
  .dropTable('manutencaoLinks')
};