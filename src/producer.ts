import "dotenv/config";
import { ServiceBusClient, type ServiceBusMessage } from "@azure/service-bus";


function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
  const queueName = process.env.QUEUE_NAME!;

  const args = Object.fromEntries(
    process.argv.slice(2).map((arg) => {
      const [key, value] = arg.replace("--", "").split("=");
      return [key, value];
    }),
  );

  // argument parsing
  const messageCount = Number(args.messageCount ?? 1);
  const messagesPerSecond = Number(args.messagesPerSecond ?? 1);
  const delayMs = 1000 / messagesPerSecond;

  const client = new ServiceBusClient(connectionString);
  const sender = client.createSender(queueName);

  for (let i = 1; i <= messageCount; i++) {
    const message: ServiceBusMessage = {
      body: `Hello World ${i}`,
    };

    await sender.sendMessages(message);
    await sleep(delayMs);
  }

  console.log("Message envoyé !");

  await sender.close();
  await client.close();
}

main();
