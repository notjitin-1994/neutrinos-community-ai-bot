import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const { message } = await req.json();
    const graphPath = path.join(process.cwd(), 'public', 'codebase_graph.json');
    let graphContext = "";
    if (fs.existsSync(graphPath)) {
      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
      graphContext = JSON.stringify(graph).substring(0, 4000); // Truncated context for safety
    }

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: `You are an expert dev assistant. Use this codebase graph context: ${graphContext}. Be verbose and include Mermaid.js graphs where useful.` },
        { role: 'user', content: message }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    return NextResponse.json({ status: "success", message: completion.choices[0].message.content });
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json({ status: "rate_limit", message: "Queueing request..." }, { status: 429 });
    }
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
