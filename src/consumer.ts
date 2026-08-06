import "dotenv/config";
import { ServiceBusClient } from "@azure/service-bus";

async function main() {

    const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
    const queueName = process.env.QUEUE_NAME!;

    const client = new ServiceBusClient(connectionString);
    const receiver = client.createReceiver(queueName);

    const messages = await receiver.receiveMessages(1);

    const message = messages[0];

    if (message) {
      console.log(message.body);

      await receiver.completeMessage(message);
    }

    await receiver.close();
    await client.close();
}

main();