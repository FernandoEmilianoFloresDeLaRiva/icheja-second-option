import type { ReactNode } from "react";
import { BluetoothContext } from "./bluetooth.context";
import { useBluetooth } from "../../../settings/hooks/useBluetooth";

export const BluetoothContextProvider = ({ children }: { children: ReactNode }) => {
  const {
    device,
    connect,
    disconnect,
    sendCommand,
    status,
    activity,
    messages,
  } = useBluetooth();

  return (
    <BluetoothContext.Provider
      value={{
        device,
        connect,
        disconnect,
        sendCommand,
        status,
        activity,
        messages,
      }}
    >
      {children}
    </BluetoothContext.Provider>
  );
};
