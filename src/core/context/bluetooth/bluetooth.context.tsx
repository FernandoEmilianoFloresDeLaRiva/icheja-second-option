import { createContext } from "react";

export interface BluetoothContextProps {
  device: BluetoothDevice | null;
  status: boolean;
  activity: boolean;
  messages: string[];
  connect: (name: string, serviceUUIDs: string[]) => Promise<void>;
  disconnect: () => void;
  sendCommand: (
    serviceUUID: string,
    characteristicUUID: string,
    command: string
  ) => Promise<void>;
}

export const BluetoothContext = createContext<BluetoothContextProps>({
  device: null,
  status: false,
  activity: false,
  messages: [],
  connect: async () => {},
  disconnect: () => {},
  sendCommand: async () => {},
});
