import db from "../database";

export async function up() {
  await db.transaction(async (trx) => {
    try {
      await db.schema.createTableIfNotExists('products', (table) => {
        table.increments('id').primary();
        table.string('name').notNullable();
        table.text('description').notNullable();
        table.decimal('price', 10, 2).notNullable();
        table.string('category').notNullable();
        table.string('pictureUrl');
        table.timestamp('created_at').defaultTo(db.fn.now());
        table.timestamp('updated_at').defaultTo(db.fn.now());
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
      await db.schema.dropTable('products');
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  });
}

