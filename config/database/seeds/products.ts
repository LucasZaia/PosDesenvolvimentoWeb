import db from "../database";
import fs from "fs";
import path from "path";

export async function seed() {

    const products = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../../../base/products.json'), 'utf8')
    );

    await db.transaction(async (trx) => {
        try {
            await trx('products').del();
            await trx('products').insert(products);
        } catch (error) {
            await trx.rollback();
            throw new Error('Error seeding products');
        } finally {
            await trx.destroy();
        }
    });

    await db('products').insert(products);
}