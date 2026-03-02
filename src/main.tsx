import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import IndexRouter from "./core/router/ui/views/IndexRouter";
import { BluetoothContextProvider } from "./core/context/bluetooth/bluetooth.provider";
import { LockScreen } from "./lockscreen/components/LockScreen";

function App() {
  const [isLocked, setIsLocked] = useState(true);

  return (
    <BluetoothContextProvider>
      {isLocked ? (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        <IndexRouter />
      )}
    </BluetoothContextProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
