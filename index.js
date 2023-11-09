const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const csvToJson = require("convert-csv-to-json");

const users = csvToJson
  .fieldDelimiter(",")
  .getJsonFromCsv("./database/user.csv");

const parser = new ReadlineParser({
  delimiter: "\r\n",
});

function Server(ports) {
  const available = ports.filter((port) => {
    return port.vendorId === "2341" && port.productId === "0043";
  });

  if (available.length > 1) {
    console.log("Only accept 1 arduino uno device");
    return;
  }

  if (available.length === 0) {
    console.log("Please connect to your Arduino Device!");
    return;
  }

  const port = new SerialPort({
    path: available[0].path,
    baudRate: 9600,
    dataBits: 8,
    parity: "none",
    stopBits: 1,
    flowControl: false,
  });

  port.pipe(parser);

  let i = 0;

  parser.on("data", function (data) {
    if (i === users.length) {
      console.log("Semua data dari file .csv telah selesai ditulis");
      process.exit(0);
      return;
    }
    if (data === "ready") {
      console.log("Writing on ID:", users[i].id);
      console.log("Tap your card to RFID Reader to continue..");
      port.write(users[i].id, (err) => {
        if (err) {
          return console.log(
            "Error when sending data to Arduino: ",
            err.message
          );
        }
      });
    }
    if (data === "success") {
      console.log("Success writing on RFID Card with ID:", users[i].id);
      console.log("---------")
      i++;
    }
    if (data === "failed") {
      console.log("Error writing on RFID Card with ID:", users[i].id);
    }
  });
}

SerialPort.list()
  .then((ports) => {
    Server(ports);
  })
  .catch((error) => {
    console.error("Error listing serial ports:", error);
  });
