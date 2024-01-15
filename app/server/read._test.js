import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

SerialPort.list().then(ports => {
  ports.forEach(port => {
    console.log(`${port.path}\t${port.manufacturer}`);
  });
});

// Replace with your Arduino's serial port
const port = new SerialPort({ path: 'COM5', baudRate: 115200 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', (data) => {
  console.log('Data:', data);
  // Here, you can parse the data and use it as needed
});

port.on('error', (err) => {
  console.error('Error:', err.message);
});
