import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, './public')));
app.get('/', (req, res) => {
	res.send('Hello from Express!');
});

wss.on('connection', (ws) => {
	console.log('WebSocket client connected');
	ws.on('close', () => console.log('WebSocket client disconnected'));
});

const broadcastData = (data) => {
	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN) {
			client.send(data);
		}
	});
};

function parseSensorData(dataString) {
	//console.log(dataString);
	const values = dataString.split('\t').map(val => val.split(':')[1]);

	return {
		time: parseInt(values[0], 10), // Extracting the timestamp
		accel: {
			x: parseInt(values[1], 10),
			y: parseInt(values[2], 10),
			z: parseInt(values[3], 10)
		},
		gyro: {
			x: parseInt(values[4], 10),
			y: parseInt(values[5], 10),
			z: parseInt(values[6], 10)
		},
		mag: {
			x: parseInt(values[7], 10),
			y: parseInt(values[8], 10),
			z: parseInt(values[9], 10)
		}
	};
}

// Serial port setup
const port = new SerialPort({ path: 'COM5', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (data) => {
	const parsedData = parseSensorData(data);
	console.log(parsedData);
	broadcastData(JSON.stringify(parsedData));
});

port.on('error', (err) => {
	console.error('Error:', err.message);
});

const PORT = 3000;
server.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
