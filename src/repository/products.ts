import db from "../../config/database/database";
import Product from "../interfaces/products";

class ProductsRepository {

    async findAll(): Promise<Product[]> {
       return await db.transaction(async (trx) => {

        try {
            const products = await trx('products');
            return products;
        } catch (error) {
            await trx.rollback();
            throw new Error('Error fetching products');
        } finally {
            await trx.destroy();
        }
       });
    }

    async findById(id: number): Promise<Product> {
        return await db.transaction(async (trx) => {
            try {
                const product = await trx('products').where('id', id).first();
                return product;
            } catch (error) {
                await trx.rollback();
                throw new Error('Error fetching product');
            } finally {
                await trx.destroy();
            }
        });
    }

    async create(product: Product): Promise<Product> {
        return await db.transaction(async (trx) => {
            try {
                const newProduct = await trx('products').insert(product).returning('*');
                return newProduct[0];
            } catch (error) {
                await trx.rollback();
                throw new Error('Error creating product');  
            } finally {
                await trx.destroy();
            }
        });
    }

    async update(id: number, product: Product): Promise<Product> {
        return await db.transaction(async (trx) => {
            try {
                const updatedProduct = await trx('products').where('id', id).update(product).returning('*');
                return updatedProduct[0];
            } catch (error) {
                await trx.rollback();
                throw new Error('Error updating product');
            } finally {
                await trx.destroy();
            }
        });
    }

    async delete(id: number): Promise<void> {
        return await db.transaction(async (trx) => {
            try {
                await trx('products').where('id', id).delete();
                await trx.commit();
            } catch (error) {
                await trx.rollback();
                throw new Error('Error deleting product');
            } finally {
                await trx.destroy();
            }
        })
    }
}

export default new ProductsRepository();