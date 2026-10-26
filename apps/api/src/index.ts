import { createServer } from "node:http";
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

const server = createServer(app);
SocketService.initialize(server);

// Vercel serves the exported server itself (HTTP and WebSocket upgrades); everywhere else we listen.
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[Reusedo API] Server running on port ${PORT}`);
  });
}

export default server;
