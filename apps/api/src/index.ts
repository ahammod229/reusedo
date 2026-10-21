import { resolve } from "node:path";
import { config } from "dotenv";

// One .env at the repo root serves web and API; apps/api/.env still works and wins.
config({
  path: [resolve(process.cwd(), ".env"), resolve(__dirname, "../../../.env")],
  quiet: true,
});
import { app } from "./server";
import { SocketService } from "./services/socket.service";

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`[Reusedo API] Server running on port ${PORT}`);
});

SocketService.initialize(server);
