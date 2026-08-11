import "dotenv/config";
import { ServiceBusClient } from "@azure/service-bus";
import { args, sleep } from "./utils.js";

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
const queueName = process.env.QUEUE_NAME!;

const client = new ServiceBusClient(connectionString);

const receiver = client.createReceiver(queueName);

const failureRate = Number(args.failureRate ?? 0);

let receivedCount = 0;
let completedCount = 0;
let abandonedCount = 0;
let totalQueueTime = 0;
let totalProcessingTime = 0;
let lastReceivedCount = 0;

// Display test status logs every 10 seconds
setInterval(() => {
  const averageQueueTime =
    receivedCount === 0 ? 0 : totalQueueTime / receivedCount;

  const averageProcessingTime =
    receivedCount === 0 ? 0 : totalProcessingTime / receivedCount;

  const consumerThroughput = (receivedCount - lastReceivedCount) / 10;
  lastReceivedCount = receivedCount;

  console.log("\n========== État du test ==========");
  console.log(`Messages reçus        : ${receivedCount}`);
  console.log(`Messages validés      : ${completedCount}`);
  console.log(`Messages abandonnés   : ${abandonedCount}`);
  console.log(`Temps moyen en queue  : ${averageQueueTime.toFixed(2)} ms`);
  console.log(`Temps moyen traitement: ${averageProcessingTime.toFixed(2)} ms`);
  console.log(`Débit du consommateur : ${consumerThroughput.toFixed(2)} msg/s`);
  console.log("==================================\n");
}, 10000);

receiver.subscribe(
  {
    processMessage: async (message) => {
      const body = message.body;

      const receivedAt = new Date();
      const sentAt = new Date(body.sentAt);
      const queueTime = receivedAt.getTime() - sentAt.getTime();

      receivedCount++;
      totalQueueTime += queueTime;

      console.log(`Message ${body.sequence} reçu`);
      console.log(`Temps passé dans la queue : ${queueTime} ms`);
      console.log(`Tentative : ${message.deliveryCount}`);

      const processingStart = Date.now();

      await sleep(Number(args.processingTimeMs ?? 100)); // temps pour traiter un msg

      const processingTime = Date.now() - processingStart;

      totalProcessingTime += processingTime;
      console.log(`Traitement terminé en ${processingTime} ms`);

      // failure simulation
      const shouldFail = Math.random() * 100 < failureRate;
      if (shouldFail) {
        console.log(`❌ Erreur simulée (tentative ${message.deliveryCount})`);
        await receiver.abandonMessage(message);
        abandonedCount++;
      } else {
        console.log(`✅ Message validé (tentative ${message.deliveryCount})`);
        await receiver.completeMessage(message);
        completedCount++;
      }
    },
    processError: async (args) => {
      console.error(args.error);
    },
  },
  {
    maxConcurrentCalls: 1,
  },
);
