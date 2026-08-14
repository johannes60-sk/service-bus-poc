import "dotenv/config";
import { ServiceBusClient, type ServiceBusMessage } from "@azure/service-bus";
import { args, getRequiredEnv, sleep, type TestMessageBody } from "./utils.js";

async function main() {
  const connectionString = getRequiredEnv("SERVICE_BUS_CONNECTION_STRING");
  const queueName = getRequiredEnv("QUEUE_NAME");

  const messageCount = Number(args.messageCount ?? 1);
  const messagesPerSecond = Number(args.messagesPerSecond ?? 1);
  const testCaseId = args.testCaseId ?? crypto.randomUUID();
  const delayMs = 1000 / messagesPerSecond;

  const client = new ServiceBusClient(connectionString);
  const sender = client.createSender(queueName);

  let sentThisSecond = 0;
  let lastSecond = Date.now();
  const testStart = Date.now();

  for (let i = 1; i <= messageCount; i++) {
    const body: TestMessageBody = {
      id: crypto.randomUUID(),
      sequence: i,
      sentAt: new Date().toISOString(),
      testCaseId,
      content: `Hello World ${i}`,
    };

    const message: ServiceBusMessage = { body };

    const start = Date.now();

    await sender.sendMessages(message);

    const timestamp =
      new Date().toLocaleTimeString("fr-FR", { hour12: false }) +
      "." +
      new Date().getMilliseconds().toString().padStart(3, "0");

    console.log(`[Test ${testCaseId}] Message ${i} envoyé à ${timestamp}  `);
    console.log(`[Test ${testCaseId}] Total envoyé : ${i} / ${messageCount}`);

    sentThisSecond++;

    const elapsed = Date.now() - start;
    const remainingDelay = Math.max(0, delayMs - elapsed);

    await sleep(remainingDelay);

    if (Date.now() - lastSecond >= 1000) {
      console.log(
        `[Test ${testCaseId}] ${sentThisSecond} messages envoyés pendant la dernière seconde`,
      );

      sentThisSecond = 0;
      lastSecond = Date.now();
    }
  }

  const totalDuration = (Date.now() - testStart) / 1000;

  console.log(`Temps total : ${totalDuration.toFixed(2)} s`);
  console.log(
    `Débit moyen : ${(messageCount / totalDuration).toFixed(2)} messages/s`,
  );
  console.log("Message envoyé !");

  await sender.close();
  await client.close();
}

main();
