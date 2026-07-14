import { createRoot } from "react-dom/client";
import Map from "./Map";

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

createRoot(root).render(<Map />);
