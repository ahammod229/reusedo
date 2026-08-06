import "dotenv/config";
import { app } from "./server";
import { SocketService } from "./services/socket.service";

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`[Reusedo API] Server running on port ${PORT}`);
});

SocketService.initialize(server);
