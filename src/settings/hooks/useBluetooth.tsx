import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";

type BluetoothMap = { [uuid: string]: BluetoothRemoteGATTCharacteristic };
type ServiceMap = { [uuid: string]: BluetoothMap };

export function useBluetooth() {
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [services, setServices] = useState<ServiceMap>({});
  const [status, setStatus] = useState(false);
  const [activity, setActivity] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setLocation] = useLocation();

  // 🔹 Maneja notificaciones de características
  const handleNotifications = useCallback(
    (char: BluetoothRemoteGATTCharacteristic) => {
      char.addEventListener("characteristicvaluechanged", async (event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (value) {
          const decoder = new TextDecoder();
          if (decoder.decode(value) === "4ON") {
            setMessages((prev) => [
              ...prev,
              `Notif [${target.uuid}]: ${decoder.decode(value)}`,
            ]);
            // 🔹 Envio OFF para desactivar el dispisitivo en modo Detección
            //await sendCommand(
            //  "12345678-1234-5678-1234-56789abcdef0", // servicio
            //  "12345678-1234-5678-1234-56789abcdef1", // característica
            //  "OFF"
            //);
            setActivity(true); //Inicia el modo Interacción de usuario
            setLocation("/");
          } else {
            setMessages((prev) => [
              ...prev,
              `Notif [${target.uuid}]: ${decoder.decode(value)}`,
            ]);
          }
        }
      });
    },
    []
  );

  // 🔹 Explora servicios y características
  const exploreServices = useCallback(
    async (server: BluetoothRemoteGATTServer, serviceUUIDs: string[]) => {
      const serviceMap: ServiceMap = {};

      for (const uuid of serviceUUIDs) {
        const service = await server.getPrimaryService(uuid);
        const characteristics = await service.getCharacteristics();
        const charMap: BluetoothMap = {};

        for (const char of characteristics) {
          charMap[char.uuid] = char;

          if (char.properties.notify) {
            await char.startNotifications();
            handleNotifications(char);
          }
        }

        serviceMap[uuid] = charMap;
      }

      setServices(serviceMap);
    },
    [handleNotifications]
  );

  // 🔹 Enviar comando a característica BLE
  const sendCommand = useCallback(
    async (
      serviceUUID: string,
      characteristicUUID: string,
      command: string
    ) => {
      try {
        const characteristic = services[serviceUUID]?.[characteristicUUID];
        if (!characteristic) throw new Error("Característica no encontrada");

        const encoder = new TextEncoder();
        await characteristic.writeValue(encoder.encode(command));
        setMessages((prev) => [...prev, `[SpecialCode] ${command}`]);
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          `Error al enviar: ${(err as Error).message}`,
        ]);
      }
    },
    [services]
  );

  // 🔹 Conectar (intenta reconectar primero, si falla → requestDevice)
  const connect = useCallback(
    async (name: string, serviceUUIDs: string[]) => {
      if (!navigator.bluetooth) {
        setMessages((prev) => [
          ...prev,
          "Tu navegador no soporta Web Bluetooth API",
        ]);
        return;
      }

      const tryConnect = async (target: BluetoothDevice, origin: string) => {
        try {
          const server = await target.gatt!.connect();
          setDevice(target);
          setStatus(true);

          await exploreServices(server, serviceUUIDs);
          setMessages((prev) => [
            ...prev,
            `[${origin}] Conectado a ${target.name}`,
          ]);
        } catch (err) {
          const errorMessage = (err as Error).message ?? String(err);
          console.error(`[${origin}] Error en tryConnect:`, err);
          setStatus(false);
          setMessages((prev) => [
            ...prev,
            `[${origin}] Error al conectar con ${target.name}: ${errorMessage}`,
          ]);
          throw err; // 🔹 Importante: relanzar para que el caller decida qué hacer
        }
      };

      try {
        /*
        // 1️⃣ Intentar recuperar con getDevices()
        if (navigator.bluetooth.getDevices) {
          const devices = await navigator.bluetooth.getDevices();
          const granted = devices.find((d) => d.name === name);
          if (granted) {
            try {
              await tryConnect(granted, "getDevices");
              return;
            } catch {
              console.warn("getDevices encontró el dispositivo pero no se pudo reconectar");
            }
          }
        }*/

        // 2️⃣ Abrir diálogo si no se pudo reconectar
        const targetDevice = await navigator.bluetooth.requestDevice({
          filters: [{ name }],
          optionalServices: serviceUUIDs,
        });
        await tryConnect(targetDevice, "requestDevice");
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          `Error al conectar: ${(err as Error).message}`,
        ]);
      }
    },
    [exploreServices, sendCommand]
  );

  // 🔹 Desconectar
  const disconnect = useCallback(() => {
    if (device?.gatt?.connected) {
      device.gatt.disconnect();
      setStatus(false);
      setActivity(false);
      setMessages((prev) => [...prev, "Dispositivo desconectado"]);
    }
  }, [device]);

  // 🔹 Escuchar desconexiones
  useEffect(() => {
    if (!device) return;

    const onDisconnected = () => {
      setStatus(false);
      setMessages((prev) => [...prev, "Conexión perdida"]);
    };

    device.addEventListener("gattserverdisconnected", onDisconnected);
    return () => {
      device.removeEventListener("gattserverdisconnected", onDisconnected);
    };
  }, [device]);

  // 🔹 Heartbeat cada 30 segundos
  useEffect(() => {
    if (!status) return;

    const HEARTBEAT_INTERVAL = 30000; // 30s
    const serviceUUID = "12345678-1234-5678-1234-56789abcdef0";
    const charUUID = "12345678-1234-5678-1234-56789abcdef1";

    const interval = setInterval(() => {
      sendCommand(serviceUUID, charUUID, "PING")
        .then(() => {
          console.log("Heartbeat enviado");
        })
        .catch((err) => {
          console.warn("Error enviando heartbeat:", err);
        });
    }, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [status, sendCommand]);

  // 🔹 Enviar "ON" cuando ya hay conexión y los services están listos
  useEffect(() => {
    if (!status) return;
    if (!services || Object.keys(services).length === 0) return;

    const serviceUUID = "12345678-1234-5678-1234-56789abcdef0";
    const charUUID = "12345678-1234-5678-1234-56789abcdef1";

    sendCommand(serviceUUID, charUUID, "ON")
      .then(() => console.log("ON enviado tras setServices"))
      .catch((err) => console.warn("Error enviando ON:", err));
  }, [status, services, sendCommand]);

  // 🔹 Enviar "OFF" cuando los services están listos y estamos en Activity
  useEffect(() => {
    if (!status) return;
    if (!services || Object.keys(services).length === 0) return;
    if (!activity) return;

    const serviceUUID = "12345678-1234-5678-1234-56789abcdef0";
    const charUUID = "12345678-1234-5678-1234-56789abcdef1";

    sendCommand(serviceUUID, charUUID, "OFF")
      .then(() => console.log("OFF enviado tras setActivity"))
      .catch((err) => console.warn("Error enviando OFF:", err));
  }, [status, services, activity, sendCommand]);

  // 🔹 Monitoreo de Usuario activo
  useEffect(() => {
    console.log("Desde Activity");

    if (!activity) return; // 🔹 Solo se activa, si Activity es true

    const resetTimer = () => {
      console.log("Algun evento");
      if (timerRef.current) clearTimeout(timerRef.current);

      // Reinicia el temporizador
      timerRef.current = setTimeout(() => {
        console.log("Usuario inactivo, enviando código especial...");
        sendCommand(
          "12345678-1234-5678-1234-56789abcdef0", // servicio
          "12345678-1234-5678-1234-56789abcdef1", // característica
          "ON" // Activamos el dispositvo en modo detección
        );
        setActivity(false);
        setLocation("/welcome")
      }, 60_000);
    };

    // Eventos a escuchar
    const events = ["click", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach((ev) => window.addEventListener(ev, resetTimer));

    // Inicia el contador cuando se conecta
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [activity, setActivity, sendCommand]); // 🔹 Dependemos de `activity`

  return {
    device,
    services,
    status,
    activity,
    messages,
    connect,
    disconnect,
    sendCommand,
  };
}
