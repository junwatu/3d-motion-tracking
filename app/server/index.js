import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { saveData, getAllData, getDatabyID, info } from './griddbservices.js';
import fs from "node:fs/promises";
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static(path.join(__dirname, './public')));

app.get('/data', async (req, res) => {
	console.log('Getting all data from GridDB');
	try {
		const result = await getAllData();
		res.json(result);
	} catch (error) {
		res.status(500).send('Error getting all data');
	}
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

function parseSensorData(data) {
	// Parse the data string
	const sensorValues = data.split('\t').map(val => parseFloat(val.split(':')[1]));

	// Assuming the order of the data is ax, ay, az, gx, gy, gz, mx, my, mz
	const [ax, ay, az, gx, gy, gz, mx, my, mz, s] = sensorValues;

	// Normalize accelerometer data if needed (currently in m/s², convert to g's if necessary)
	const accel = {
		x: ax / 1000,
		y: ay / 1000,
		z: az / 1000
	};

	// Gyroscope data is in rad/s, which is what the Madgwick filter expects, so no conversion needed
	const gyro = { x: gx, y: gy, z: gz };

	// Magnetometer data is in microteslas (uT), convert to Teslas by dividing by 1,000,000 if necessary
	const mag = {
		x: mx / 1000000,
		y: my / 1000000,
		z: mz / 1000000
	};

	const temp = { s }

	return { accel, gyro, mag, s };
}

// Serial port setup
const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

if (process.env.TRACKING_DEMO === "OK" && port?.port === undefined) {
	(async () => {
		try {
			await broadcastDemoData();
		} catch (error) {
			console.log(error);
		}
	})();
}

parser.on('data', async (data) => {
	console.log(data);
	console.log("Live data reading...");
	const parsedData = parseSensorData(data);
	//await saveData({ sensorData: JSON.stringify(parsedData) });
	console.log(parsedData)
	broadcastData(JSON.stringify(parsedData));
});

port.on('error', (err) => {
	console.error('Error:', err.message);
});

const PORT = 3000;
const HOST = 'localhost';

server.listen(PORT, HOST, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});

async function broadcastDemoData() {
	try {
		console.log("DEMO version...");

		const data = await fs.readFile(path.join(__dirname, './data.json'), { encoding: 'utf8' });
		const parsedData = JSON.parse(data).results;

		if (parsedData.length > 0) {
			parsedData.forEach(async (item) => {
				broadcastData(item.data);
				await delay(500);
			});
		} else {
			console.log("DEMO data is empty");
		}
	} catch (error) {
		console.error("Error reading or parsing DEMO data:", error);
	}
	setTimeout(broadcastDemoData, 1000);
}

function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

