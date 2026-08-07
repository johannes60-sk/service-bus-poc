import "dotenv/config";
import { ServiceBusClient, type ServiceBusMessage } from "@azure/service-bus";
import { args } from "./utils.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
  const queueName = process.env.QUEUE_NAME!;

  // argument parsing
  const messageCount = Number(args.messageCount ?? 1);
  const messagesPerSecond = Number(args.messagesPerSecond ?? 1);
  const testCaseId = args.testCaseId ?? crypto.randomUUID();
  const delayMs = 1000 / messagesPerSecond;

  const client = new ServiceBusClient(connectionString);
  const sender = client.createSender(queueName);

  let sentThisSecond = 0;
  let lastSecond = Date.now();

  for (let i = 1; i <= messageCount; i++) {
    const message: ServiceBusMessage = {
      body: {
        id: crypto.randomUUID(),
        sequence: i,
        sentAt: new Date().toISOString(),
        testCaseId: testCaseId,
        content: `Hello World ${i}`,
      },
    };

    await sender.sendMessages(message);

    const timestamp =
      new Date().toLocaleTimeString("fr-FR", { hour12: false }) +
      "." +
      new Date().getMilliseconds().toString().padStart(3, "0");

    console.log(`[Test ${testCaseId}] Message ${i} envoyé à ${timestamp}  `);
    console.log(`[Test ${testCaseId}] Total envoyé : ${i} / ${messageCount}`);

    sentThisSecond++;
    await sleep(delayMs); // Wait for the specified delay before sending the next message

    if (Date.now() - lastSecond >= 1000) {
      console.log(
        `[Test ${testCaseId}] ${sentThisSecond} messages envoyés pendant la dernière seconde`,
      );

      sentThisSecond = 0;
      lastSecond = Date.now();
    }
  }

  console.log("Message envoyé !");

  await sender.close();
  await client.close();
}

main();
