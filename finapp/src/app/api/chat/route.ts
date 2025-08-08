import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse-new";
import { getAssistantPrompt } from "@/lib/prompts";

const bedrockClient = new BedrockRuntimeClient({
    region: "us-east-1",
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const message = formData.get("message") as string;
        const conversationHistoryStr = formData.get("conversationHistory") as string;
        const aiConfigStr = formData.get("aiConfig") as string;
        const pageType = formData.get("pageType") as string;
        const customPrompt = formData.get("customPrompt") as string;
        const file = formData.get("file") as File | null;

        const conversationHistory = conversationHistoryStr ? JSON.parse(conversationHistoryStr) : [];
        const aiConfig = aiConfigStr ? JSON.parse(aiConfigStr) : {
            model: "us.anthropic.claude-3-5-haiku-20241022-v1:0",
            temperature: 0.5,
            maxTokens: 10000
        };

        let pdfContent = "";
        if (file) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const data = await pdf(buffer);
            pdfContent = data.text;
        }

        const assistantPrompt = customPrompt || getAssistantPrompt(pageType || 'prob6');

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
                content: `${message}${pdfContent ? `\n\nPDF Content:\n${pdfContent}` : ""}`,
            },
        ];

        const body = JSON.stringify({
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: aiConfig.maxTokens,
            temperature: aiConfig.temperature,
            messages: bedrockMessages,
        });

        const command = new InvokeModelCommand({
            modelId: aiConfig.model,
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
            fileContent: pdfContent,
            success: true,
        });
    } catch (error: any) {
        console.error("Error from Bedrock Claude:", error);
        
        let errorMessage = "AI model error";
        let userMessage = "An error occurred while processing your request.";
        
        if (error.name === 'ThrottlingException') {
            errorMessage = "Rate limit exceeded";
            userMessage = "Too many requests. Please wait a moment and try again.";
        } else if (error.name === 'ValidationException') {
            errorMessage = "Invalid request";
            userMessage = "The request format is invalid. Please check your input.";
        } else if (error.name === 'AccessDeniedException') {
            errorMessage = "Access denied";
            userMessage = "Access to the AI model is denied. Please check your credentials.";
        } else if (error.name === 'ModelNotReadyException') {
            errorMessage = "Model not ready";
            userMessage = "The AI model is currently unavailable. Please try again later.";
        }
        
        return NextResponse.json(
            {
                error: errorMessage,
                message: userMessage,
                details: error.message || "Unknown error",
                success: false
            },
            { status: 500 }
        );
    }
}