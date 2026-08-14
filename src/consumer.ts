import "dotenv/config";
import { ServiceBusClient } from "@azure/service-bus";
import { args, getRequiredEnv, sleep, type TestMessageBody } from "./utils.js";

async function main() {
  const connectionString = getRequiredEnv("SERVICE_BUS_CONNECTION_STRING");
  const queueName = getRequiredEnv("QUEUE_NAME");

  const client = new ServiceBusClient(connectionString);
  const receiver = client.createReceiver(queueName);

  const messages = await receiver.receiveMessages(1);
  const message = messages[0];

  if (!message) {
    console.log("Aucun message disponible.");
    await receiver.close();
    await client.close();
    return;
  }

  const body = message.body as TestMessageBody;
  const receivedAt = new Date();
  const queueTimeMs = receivedAt.getTime() - new Date(body.sentAt).getTime();

  console.log(`Message ID       : ${body.id}`);
  console.log(`Séquence        : ${body.sequence}`);
  console.log(`TestCaseId      : ${body.testCaseId}`);
  console.log(`Temps en queue  : ${queueTimeMs} ms`);
  console.log("SentAt     :", body.sentAt);
  console.log("ReceivedAt :", receivedAt.toISOString());

  const processingStart = Date.now();
  await sleep(Number(args.processingTimeMs ?? 1000));
  const processingTimeMs = Date.now() - processingStart;

  console.log(`Temps de traitement : ${processingTimeMs} ms`);
  console.log(`Tentative : ${message.deliveryCount}`);

  const failureRate = Number(args.failureRate ?? 0);
  const shouldFail = Math.random() * 100 < failureRate;
  if (shouldFail) {
    console.log("❌ Erreur simulée");
    await receiver.abandonMessage(message);
  } else {
    console.log("✅ Traitement réussi");
    await receiver.completeMessage(message);
  }

  await receiver.close();
  await client.close();
}

main();
