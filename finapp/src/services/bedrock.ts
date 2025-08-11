import {
  BedrockRuntime,
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  GPTMessage,
  OpenAICred,
  AIFeatureKeys,
  AIFeatureSettings,
} from "../models/types";
let client = new BedrockRuntime({ region: "us-east-1" });

let runTimeClient = new BedrockRuntimeClient({ region: "us-east-1" });
export interface AIResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: {
    type: string;
    text: string;
  }[];
  stop_reason?: string;
  stop_sequence?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
export interface AIResponseStream {
  id: string;
  type: string;
  role: string;
  model: string;
  content: {
    type: string;
    text: string;
  };
  delta: {
    type: string;
    text: string;
  };
  stop_reason?: string;
  stop_sequence?: string;
  "amazon-bedrock-invocationMetrics": {
    inputTokenCount: number;
    outputTokenCount: number;
    invocationLatency: number;
    firstByteLatency: number;
  };
}

export const invokeCommand = async (
  message: GPTMessage[],
  feature: AIFeatureKeys,
  settings?: OpenAICred
): Promise<AIResponse> => {
  const featureSettings: AIFeatureSettings | undefined =
    settings?.features?.[feature];
  if (featureSettings?.region !== client.config.region) {
    client = new BedrockRuntime({
      region: featureSettings?.region,
    });
  }
  const inputBody = {
    max_tokens: featureSettings?.maxTokens
      ? Number(featureSettings?.maxTokens)
      : 50000,
    temperature: featureSettings?.temperature
      ? Number(featureSettings?.temperature)
      : 0.5,
    top_p: featureSettings?.topP ? Number(featureSettings?.topP) : 1.0,
    top_k: featureSettings?.topK ? Number(featureSettings?.topK) : 250,
    messages: message,
    anthropic_version:
      featureSettings?.anthropicVersion || "bedrock-2023-05-31",
  };
  const command = new InvokeModelCommand({
    body: JSON.stringify(inputBody),
    contentType: "application/json",
    accept: "application/json",
    modelId:
      featureSettings?.bedRockModel ||
      "us.anthropic.claude-sonnet-4-20250514-v1:0",
  });

  const response = await client.send(command);
  const responseBody: AIResponse = JSON.parse(
    new TextDecoder().decode(response.body)
  );
  return responseBody;
};

export async function* invokeCommandStream(
  message: GPTMessage[],
  feature: AIFeatureKeys,
  settings?: OpenAICred
): AsyncGenerator<string> {
  const featureSettings: AIFeatureSettings | undefined =
    settings?.features?.[feature];
  if (featureSettings?.region !== runTimeClient.config.region) {
    runTimeClient = new BedrockRuntimeClient({
      region: featureSettings?.region,
    });
  }
  const inputBody = {
    max_tokens: featureSettings?.maxTokens
      ? Number(featureSettings?.maxTokens)
      : 50000,
    temperature: featureSettings?.temperature
      ? Number(featureSettings?.temperature)
      : 0.5,
    top_p: featureSettings?.topP ? Number(featureSettings?.topP) : 1.0,
    top_k: featureSettings?.topK ? Number(featureSettings?.topK) : 250,
    messages: message,
    anthropic_version:
      featureSettings?.anthropicVersion || "bedrock-2023-05-31",
  };
  const command = new InvokeModelWithResponseStreamCommand({
    body: JSON.stringify(inputBody),
    contentType: "application/json",
    accept: "application/json",
    modelId:
      featureSettings?.bedRockModel ||
      "us.anthropic.claude-3-5-haiku-20241022-v1:0",
  });

  const response = await runTimeClient.send(command);
  if (!response.body) {
    throw new Error("Response body is undefined");
  }
  for await (const chunk of response.body!) {
    yield new TextDecoder().decode(chunk.chunk?.bytes);
  }
}
