import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";

const bedrockClient = new BedrockRuntimeClient({
    region: "us-east-1",
});

export async function POST(request: NextRequest) {
    try {
        const { message, conversationHistory } = await request.json();

        const assistantPrompt = `
        
        You are a call evaluator at Trajector, a company that helps Veterans receive the benefits they deserve by assisting in the creation of medical documentation. You will be provided with a transcript of a call between one of our representatives and a potential Veteran client.

Your task is to evaluate the quality and effectiveness of the call by assessing the following criteria:

The Veteran’s emotional state throughout the call

The Veteran’s described symptoms and how clearly they were communicated

The Veteran’s overall experience during the call (e.g., tone, comfort, engagement)

The Veteran’s qualifications for current benefit increases

The Veteran’s potential eligibility for future benefits

Please identify the Veteran using the number provided and our representative by name.

Your Output Should Be:
Format all responses as valid HTML snippets. Use semantic tags (<p>, <ul>, <strong>, etc.) and avoid inline styles, scripts, or external references. Ensure output is safe for use with dangerouslySetInnerHTML in React.

Include a percentage score representing the overall quality of the call

Include short bullet point assessments under each of the five evaluation areas

Conclude with a brief summary paragraph indicating whether the Veteran is a strong candidate for benefits or follow-up. Determine whether the Veteran is eligible for future benefits based on the assessments.

If the Veteran is not eligible for future benefits, provide a brief explanation of why.

If the Veteran is eligible for future benefits, provide a brief explanation of why.

        `

        const bedrockMessages = [
            ...conversationHistory.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: "assistant",
                content: assistantPrompt,
            },
            {
                role: "user",
                content: message,
            },
        ];

        const body = JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 10000,
            temperature: 0.5,
            messages: bedrockMessages,
        });

        const command = new InvokeModelCommand({
            modelId: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body,
        });

        const response = await bedrockClient.send(command);

        const responseBody = await response.body?.transformToString?.(); // if available
        const parsed = JSON.parse(
            responseBody || new TextDecoder().decode(response.body)
        );

        const assistantMessage = parsed?.content?.[0]?.text?.trim() || "";

        return NextResponse.json({
            message: assistantMessage,
            success: true,
        });
    } catch (error) {
        console.error("Error from Bedrock Claude:", error);
        return NextResponse.json(
            {
                error: "AI model error",
                details: error instanceof Error ? error.message : "Unknown",
            },
            { status: 500 }
        );
    }
}
