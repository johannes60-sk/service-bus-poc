import "dotenv/config";
import { ServiceBusClient } from "@azure/service-bus";
import { args, sleep } from "./utils.js";

async function main() {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
  const queueName = process.env.QUEUE_NAME!;

  const client = new ServiceBusClient(connectionString);
  const receiver = client.createReceiver(queueName);

  const messages = await receiver.receiveMessages(1);
  const message = messages[0];

  if (!message) {
    console.log("Aucun message disponible.");
    return;
  }

  if (message) {

    const body = message.body;
    const receivedAt = new Date();
    const queueTimeMs = receivedAt.getTime() - new Date(body.sentAt).getTime();

    console.log(`Message ID       : ${body.id}`);
    console.log(`Séquence        : ${body.sequence}`);
    console.log(`TestCaseId      : ${body.testCaseId}`);
    console.log(`Temps en queue  : ${queueTimeMs} ms`);
    console.log("SentAt     :", body.sentAt);
    console.log("ReceivedAt :", receivedAt.toISOString());

    // Simulate processing time
    const processingStart = Date.now();
    await sleep(1000);
    const processingTimeMs = Date.now() - processingStart;

    console.log(`Temps de traitement : ${processingTimeMs} ms`);
    console.log(`Tentative : ${message.deliveryCount}`);

    // Simulate failure msg
    const failureRate = Number(args.failureRate ?? 0);
    const shouldFail = Math.random() * 100 < failureRate; // simuler 10% de chance d'échec
    if (shouldFail) {
      console.log("❌ Erreur simulée");
      await receiver.abandonMessage(message); // indique à Azure que le traitement a échoué afin qu'il remette le message dans la queue pour une nouvelle tentative.
    } else {
      console.log("✅ Traitement réussi");
      await receiver.completeMessage(message);
    }
  }

  await receiver.close();
  await client.close();
}

main();
