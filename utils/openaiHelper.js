"use strict";

const OpenAI = require("openai");
require("dotenv").config();

let client = null;

function getClient() {
    if (!client) {
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return client;
}

const SYSTEM_PROMPTS = {
    fund: "You are a financial analyst specializing in Indian and US stock markets. Answer questions about company fundamentals, financial ratios, earnings, valuations, and investment analysis. Be concise and accurate.",
    news: "You are a market news analyst with deep knowledge of financial markets. Answer questions about market events, company news, economic indicators, and financial developments using your training knowledge.",
    news_bing: "You are a market news analyst with deep knowledge of financial markets. Answer questions about market events, company news, economic indicators, and financial developments using your training knowledge.",
    youtube: "You are a financial content analyst. Summarize and explain financial content clearly and concisely.",
    reddit: "You are a market sentiment analyst. Analyze market discussions and provide balanced insights on investor sentiment.",
    screener: "You are a stock screener analyst. Help users find and analyze stocks based on financial criteria.",
    default: "You are a helpful financial assistant specializing in stock markets, investment analysis, and financial planning."
};

function buildSystemPrompt(flag) {
    return SYSTEM_PROMPTS[flag] || SYSTEM_PROMPTS.default;
}

async function chatCompletion(messages) {
    const response = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages,
    });
    const text = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.total_tokens || 0;
    return { text, tokens };
}

async function streamChatCompletion(messages, onChunk, onDone) {
    const stream = await getClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        stream: true,
    });

    let fullText = "";
    for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || "";
        if (delta) {
            fullText += delta;
            onChunk(delta);
        }
    }
    await onDone(fullText);
}

module.exports = { buildSystemPrompt, chatCompletion, streamChatCompletion };
