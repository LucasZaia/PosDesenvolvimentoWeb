import type { Knex } from "knex";
import dotenv from "dotenv";

dotenv.config();

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || "5432"),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE
    },
    migrations: {
      directory: "./config/database/migrations",
      extension: "ts"
    },
    seeds: {
      directory: "./config/database/seeds",
      extension: "ts"
    }
  }
}

export default config;