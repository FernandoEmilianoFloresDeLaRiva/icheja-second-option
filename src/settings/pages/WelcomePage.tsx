import { useContext, useState } from "react";
import AppLayout from "../../common/layouts/AppLayout/AppLayout";
import { motion } from "framer-motion";
import { Bluetooth, BluetoothOff, Send } from "lucide-react";
import { BluetoothContext } from "../../core/context/bluetooth/bluetooth.context";

export default function SettingsPage() {
  const { device, connect, disconnect, sendCommand, status } =
    useContext(BluetoothContext);
  const [input, setInput] = useState("");

  const ESP32_NAME = "ESP32_BLE";
  const SERVICES = [
    "12345678-1234-5678-1234-56789abcdef0", // Servicio principal
  ];

  const handleSendCommand = () => {
    if (input.trim()) {
      sendCommand(
        "12345678-1234-5678-1234-56789abcdef0", // servicio
        "12345678-1234-5678-1234-56789abcdef1", // característica RX
        input
      );
      setInput("");
    }
  };

  return (
    <AppLayout>
      <motion.div
        className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="p-8 space-y-8">
          {/* Status Section */}
          <motion.div
            className={`rounded-2xl p-6 border-2 transition-all duration-300 ${
              status
                ? "bg-green-50 border-green-300 shadow-lg shadow-green-100"
                : "bg-red-50 border-red-300 shadow-lg shadow-red-100"
            }`}
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-center space-x-4">
              {status ? (
                <Bluetooth size={48} className="text-green-500" />
              ) : (
                <BluetoothOff size={48} className="text-red-500" />
              )}
              <div className="text-center">
                <h2
                  className={`text-2xl font-bold ${
                    status ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {status ? "CONECTADO" : "DESCONECTADO"}
                </h2>
                {device && (
                  <p className="text-gray-600 mt-1">
                    Dispositivo: {device.name}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Connection Controls */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <button
              className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                status
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:from-green-600 hover:to-emerald-500 shadow-lg hover:shadow-xl hover:cursor-pointer"
              }`}
              onClick={() => connect(ESP32_NAME, SERVICES)}
              disabled={status}
            >
              <Bluetooth size={20} />
              <span>Conectar</span>
            </button>
            <button
              className={`flex items-center justify-center space-x-3 py-4 px-6 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                !status
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-white text-red-500 border-2 border-red-300 hover:bg-red-50 hover:border-red-400 shadow-lg hover:shadow-xl hover:cursor-pointer"
              }`}
              onClick={() => disconnect()}
              disabled={!status}
            >
              <BluetoothOff size={20} />
              <span>Desconectar</span>
            </button>
          </motion.div>

          {/* Command Panel */}
          <motion.div
            className="bg-gray-50 rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Panel de Comandos
            </h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu comando aquí..."
                disabled={!status}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendCommand();
                  }
                }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all duration-300 ${
                  !status
                    ? "bg-gray-200 border-gray-300 cursor-not-allowed"
                    : "bg-white border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                }`}
              />
              <button
                className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                  !status || !input.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-pink-400 text-white hover:from-red-600 hover:to-pink-500 shadow-lg hover:shadow-xl"
                }`}
                onClick={handleSendCommand}
                disabled={!status || !input.trim()}
              >
                <Send size={18} />
                <span>Enviar</span>
              </button>
            </div>
          </motion.div>

          {/* Info Tags */}
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-200">
              Dispositivo: {ESP32_NAME}
            </span>
            <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium border border-purple-200">
              Bluetooth LE
            </span>
            <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
              Estado: Listo
            </span>
          </motion.div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
