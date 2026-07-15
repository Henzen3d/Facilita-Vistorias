import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";
import {
  QUEUE_AI_DESCRIBE,
  QUEUE_GENERATE_PDF,
  type AiDescribeItemJob,
  type GeneratePdfJob,
} from "./jobs";

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 5000,
  },
  removeOnComplete: 100,
  removeOnFail: 200,
};

let aiDescribeQueueInstance: Queue<AiDescribeItemJob> | null = null;
let generatePdfQueueInstance: Queue<GeneratePdfJob> | null = null;

/** Lazy Proxy: opens Redis only on first method/property access. */
function lazyQueue<T>(
  get: () => Queue<T> | null,
  set: (q: Queue<T>) => void,
  factory: () => Queue<T>,
): Queue<T> {
  return new Proxy({} as Queue<T>, {
    get(_target, prop, receiver) {
      let instance = get();
      if (!instance) {
        instance = factory();
        set(instance);
      }
      const value = Reflect.get(instance as object, prop, receiver);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(instance)
        : value;
    },
  });
}

/** BullMQ queue for AI describe-item jobs. */
export const aiDescribeQueue: Queue<AiDescribeItemJob> = lazyQueue(
  () => aiDescribeQueueInstance,
  (q) => {
    aiDescribeQueueInstance = q;
  },
  () =>
    new Queue<AiDescribeItemJob>(QUEUE_AI_DESCRIBE, {
      connection: getRedisConnection(),
      defaultJobOptions,
    }),
);

/** BullMQ queue for PDF generation jobs. */
export const generatePdfQueue: Queue<GeneratePdfJob> = lazyQueue(
  () => generatePdfQueueInstance,
  (q) => {
    generatePdfQueueInstance = q;
  },
  () =>
    new Queue<GeneratePdfJob>(QUEUE_GENERATE_PDF, {
      connection: getRedisConnection(),
      defaultJobOptions,
    }),
);

/** Enqueue AI describe job; jobId `ai-${itemId}` avoids duplicate in-flight jobs. */
export async function enqueueAiDescribeItem(data: AiDescribeItemJob) {
  return aiDescribeQueue.add("describe-item", data, {
    jobId: `ai-${data.itemId}`,
  });
}

/** Enqueue PDF generation; jobId `pdf-${vistoriaId}` avoids duplicate in-flight jobs. */
export async function enqueueGeneratePdf(data: GeneratePdfJob) {
  return generatePdfQueue.add("generate-pdf", data, {
    jobId: `pdf-${data.vistoriaId}`,
  });
}
