/**
 * Configuración de Bluetooth LE para ESP32
 * 
 * INSTRUCCIONES PARA ACTUALIZAR:
 * 1. Reemplaza los valores de DEVICE_NAME, SERVICE_UUID y CHARACTERISTIC_UUID
 *    con los datos reales del ESP32
 * 2. Verifica que el ESP32 se anuncia con el nombre exacto
 * 3. Asegúrate de que el servicio y característica tengan las propiedades:
 *    - write (para enviar "ON", "OFF", "PING")
 *    - notify (para recibir notificaciones como "4ON")
 */

export interface BluetoothConfig {
  // Nombre del dispositivo BLE
  deviceName: string;
  
  // UUID del servicio GATT principal
  serviceUUID: string;
  
  // UUID de la característica para leer/escribir
  characteristicUUID: string;
  
  // Timeout de inactividad en milisegundos
  inactivityTimeoutMs: number;
  
  // Intervalo de heartbeat (PING) en milisegundos
  heartbeatIntervalMs: number;
  
  // Número máximo de reintentos de conexión
  maxConnectionRetries: number;
  
  // Retraso entre reintentos en milisegundos
  retryDelayMs: number;
}

/**
 * CONFIGURACIÓN POR DEFECTO (PLACEHOLDERS)
 * 
 * ⚠️ ESTOS SON VALORES DE PRUEBA
 * Actualiza con los datos reales del ESP32 antes de producción
 */
export const BLUETOOTH_CONFIG: BluetoothConfig = {
  // Nombre del dispositivo ESP32 en BLE
  // Verifica en el código del ESP32: esp_ble_gap_set_device_name("...")
  deviceName: "ESP32_BLE",
  
  // UUID del servicio principal
  // Obtén del código ESP32 o con herramienta de escaneo BLE
  serviceUUID: "12345678-1234-5678-1234-56789abcdef0",
  
  // UUID de la característica para comunicación
  // Debe tener propiedades: write, notify
  characteristicUUID: "12345678-1234-5678-1234-56789abcdef1",
  
  // 60 segundos de inactividad antes de volver a modo detección
  inactivityTimeoutMs: 60 * 1000,
  
  // Heartbeat cada 30 segundos
  heartbeatIntervalMs: 30 * 1000,
  
  // Reintentar hasta 3 veces si falla la conexión
  maxConnectionRetries: 3,
  
  // Esperar 2 segundos entre reintentos
  retryDelayMs: 2 * 1000,
};

/**
 * Códigos especiales de comunicación
 */
export const BLUETOOTH_COMMANDS = {
  // Activar sensor en modo detección
  ACTIVATE_DETECTION: "ON",
  
  // Desactivar sensor
  DEACTIVATE: "OFF",
  
  // Mantener conexión viva
  HEARTBEAT: "PING",
  
  // Código que el sensor envía cuando detecta proximidad
  PROXIMITY_DETECTED: "4ON",
} as const;

/**
 * Validar configuración (útil para detectar valores de prueba)
 */
export function isDefaultConfig(): boolean {
  return (
    BLUETOOTH_CONFIG.serviceUUID === "12345678-1234-5678-1234-56789abcdef0" ||
    BLUETOOTH_CONFIG.characteristicUUID === "12345678-1234-5678-1234-56789abcdef1"
  );
}

/**
 * Obtener información de configuración para logging
 */
export function getConfigInfo(): string {
  return `
[Bluetooth Config]
- Device: ${BLUETOOTH_CONFIG.deviceName}
- Service UUID: ${BLUETOOTH_CONFIG.serviceUUID}
- Char UUID: ${BLUETOOTH_CONFIG.characteristicUUID}
- Inactivity Timeout: ${BLUETOOTH_CONFIG.inactivityTimeoutMs}ms
- Heartbeat: ${BLUETOOTH_CONFIG.heartbeatIntervalMs}ms
- Max Retries: ${BLUETOOTH_CONFIG.maxConnectionRetries}
- Retry Delay: ${BLUETOOTH_CONFIG.retryDelayMs}ms
${isDefaultConfig() ? "\n⚠️ USANDO VALORES POR DEFECTO - ACTUALIZA CON DATOS DEL ESP32" : ""}
  `.trim();
}
