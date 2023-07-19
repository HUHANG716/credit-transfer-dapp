import "reflect-metadata";
import { DataSource } from "typeorm";
import { Institution } from "./entity/Institution";
import { Course } from "./entity/Course";

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: "database.sqlite",
  synchronize: true,
  logging: false,
  entities: [Institution, Course],
  migrations: [],
  subscribers: [],
});
