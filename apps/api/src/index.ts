import { app } from "./server";

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`[Reusedo API] Server running on port ${PORT}`);
});
