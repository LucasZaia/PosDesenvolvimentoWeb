
import {ProductCategory} from "skeleton/dist/types";
import fs, { writeFile } from 'fs/promises';
import axios from "axios";

interface PermissibleProduct {
  id: number;
  name: string;
}

export async function main () {
  const products = await getProducts();
  processProducts(products);
}

async function readFile() {
    const data = await fs.readFile('../base/products.json', 'utf8');
    const products = JSON.parse(data);
    return products;
}

async function getProducts(): Promise<PermissibleProduct[]> {

  let allowedProducts: Array<PermissibleProduct> = [];

  try {
    const products = await readFile();

    for (const product of products) {
      const category = product.category;
      const categoryIsAllowed = await checkCategory(category);

      console.log("Produto: ", product.name);
      console.log("Categoria: ", category);
      console.log("Categoria permitida: ", categoryIsAllowed);

      if (categoryIsAllowed) {
        
        const permissibleProduct: PermissibleProduct = {
          id: product.id,
          name: product.name
        }
        
        allowedProducts.push(permissibleProduct);
      } 
    }
    return allowedProducts;
   } catch (error) {
    console.error(error);
    return [];
   }
}

async function checkCategory(category: string) : Promise<boolean> {
  try {
    const response = await axios.get(`https://posdesweb.igormaldonado.com.br/api/allowedCategory?category=${category}`);
    const isAllowed = response.data.allowed;
    return isAllowed;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function processProducts(products: PermissibleProduct[]) {
  const processedProducts = JSON.stringify(products);
  fs.writeFile('../base/processed_products.json', processedProducts);
}

main();

const a: ProductCategory = ProductCategory.Moda;