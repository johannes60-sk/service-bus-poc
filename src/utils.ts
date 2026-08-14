export type CliArgs = Record<string, string | undefined>;

export type TestMessageBody = {
  id: string;
  sequence: number;
  sentAt: string;
  testCaseId: string;
  content: string;
};

export function parseArgs(argv: string[]): CliArgs {
  return Object.fromEntries(
    argv.map((arg) => {
      const [key, value] = arg.replace(/^--/, "").split("=");
      return [key, value];
    }),
  );
}

export const args = parseArgs(process.argv.slice(2));

export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
