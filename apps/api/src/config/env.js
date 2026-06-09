import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Always load the API-specific .env file, even if the server starts from the repo root.
// override: true ensures local .env wins over inherited shell/process env (e.g. production URLs).
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
  override: true,
});
