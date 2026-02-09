import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import IndexRouter from "./core/router/ui/views/IndexRouter";
import { BluetoothContextProvider } from "./core/context/bluetooth/bluetooth.provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BluetoothContextProvider>
      <IndexRouter />
    </BluetoothContextProvider>
  </StrictMode>
);
