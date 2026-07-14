import homepage from "../index.html";

const port = Number(process.env.PORT ?? 5173);

Bun.serve({
  port,
  routes: {
    "/": homepage,
  },
  development: true,
});

console.log(`Map app http://localhost:${port}`);
