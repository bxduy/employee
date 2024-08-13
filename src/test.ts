
import * as dotenv from "dotenv"
dotenv.config({path: '../.env'});
console.log(process.env.DB_PASS, process.env.DB, process.env.DB_USER, process.env.DB_HOST, process.env.DB_PORT);
