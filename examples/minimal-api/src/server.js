import { createServer } from "node:http";

const todos = [
  { id: 1, title: "Document the workflow", done: false },
  { id: 2, title: "Add request validation", done: false }
];

const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  if (req.url === "/todos") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ todos }));
    return;
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => {
  console.log("Minimal API listening on http://localhost:3000");
});
