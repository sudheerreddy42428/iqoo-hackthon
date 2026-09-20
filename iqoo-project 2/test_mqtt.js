const mqtt = require('mqtt');
console.log("Connecting...");
const client = mqtt.connect('wss://broker.hivemq.com:8443/mqtt');
client.on('connect', () => {
  console.log("Connected successfully!");
  process.exit(0);
});
client.on('error', (err) => {
  console.error("Error:", err);
  process.exit(1);
});
setTimeout(() => {
  console.error("Timeout!");
  process.exit(1);
}, 5000);
