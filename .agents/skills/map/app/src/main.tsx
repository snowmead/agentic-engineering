import { createRoot } from "react-dom/client";
import { WorkerPoolContextProvider } from "@pierre/diffs/react";
import MapView from "./Map";
import { workerFactory } from "./workerFactory";

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root");

Object.assign(document.body.style, {
  margin: "0",
  minHeight: "100vh",
  background: "#181818",
});
Object.assign(root.style, {
  minHeight: "100vh",
});

createRoot(root).render(
  <WorkerPoolContextProvider
    poolOptions={{ workerFactory, poolSize: 2 }}
    highlighterOptions={{
      theme: { dark: "pierre-dark", light: "pierre-light" },
      langs: [
        "typescript",
        "tsx",
        "javascript",
        "jsx",
        "json",
        "html",
        "css",
        "markdown",
        "rust",
        "python",
        "go",
        "yaml",
        "toml",
        "bash",
        "shellscript",
      ],
    }}
  >
    <MapView />
  </WorkerPoolContextProvider>,
);
