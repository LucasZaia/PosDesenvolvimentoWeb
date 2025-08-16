import db from "../database";

export async function up() {
  await db.transaction(async (trx) => {
    try {
      await db.schema.createTableIfNotExists('users', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.string('email').notNullable();
        table.string('password').notNullable();
      });

      await db.schema.createTableIfNotExists('roles', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
      });

      await db.schema.createTableIfNotExists('user_roles', (table) => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.integer('role_id').notNullable();
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
}

export async function down() {
  await db.transaction(async (trx) => {     
    try {
      await db.schema.dropTable('users');
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });

  await db.transaction(async (trx) => {
    try {
      await db.schema.dropTable('roles');
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });

  await db.transaction(async (trx) => {
    try {
      await db.schema.dropTable('user_roles');
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
}