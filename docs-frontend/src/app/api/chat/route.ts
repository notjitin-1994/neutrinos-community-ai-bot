import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const message = body?.message;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const openai = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || 'dummy_key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });

    const graphPath = path.join(process.cwd(), 'public', 'codebase_graph.json');
    let graphContext = "";

    if (fs.existsSync(graphPath)) {
      let availableKeys: string[] = [];
      let nodes: Record<string, any> = {};

      try {
        const rawGraph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
        nodes = rawGraph.nodes || rawGraph;
        availableKeys = Object.keys(nodes);
      } catch (err) {
        console.error("Error reading graph JSON file:", err);
      }

      if (availableKeys.length > 0) {
        // 8B routing call to select relevant files
        const routingCompletion = await openai.chat.completions.create({
          model: 'meta/llama-3.1-8b-instruct',
          messages: [
            {
              role: 'system',
              content: 'You are a code routing assistant. Given a list of codebase file paths and a user request, select the 2-3 most relevant file paths. Return ONLY a JSON array of selected file paths, e.g. ["src/neutrinos_bot/generator.py"]. Do not include any explanations.'
            },
            {
              role: 'user',
              content: `User Question: "${message}"\n\nAvailable File Paths:\n${JSON.stringify(availableKeys)}`
            }
          ],
          temperature: 0.1,
          max_tokens: 256,
        });

        const routingContent = routingCompletion.choices[0]?.message?.content || "";
        let selectedKeys: string[] = [];
        try {
          const match = routingContent.match(/\[[\s\S]*?\]/);
          if (match) {
            selectedKeys = JSON.parse(match[0]);
          } else {
            selectedKeys = JSON.parse(routingContent);
          }
        } catch {
          selectedKeys = availableKeys.slice(0, 3);
        }

        const prunedGraph: Record<string, any> = {};
        if (Array.isArray(selectedKeys)) {
          for (const key of selectedKeys) {
            if (nodes[key]) {
              prunedGraph[key] = nodes[key];
            }
          }
        }

        if (Object.keys(prunedGraph).length === 0 && availableKeys.length > 0) {
          availableKeys.slice(0, 3).forEach((k) => {
            prunedGraph[k] = nodes[k];
          });
        }

        graphContext = JSON.stringify(prunedGraph);
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        {
          role: 'system',
          content: `You are an expert dev assistant. Use this codebase graph context: ${graphContext}. Be verbose and include Mermaid.js graphs where useful.`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    const responseContent = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ status: "success", message: responseContent });
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json({ status: "rate_limit", message: "Queueing request..." }, { status: 429 });
    }
    return NextResponse.json({ status: "error", message: `Server error: ${error.message || error}` }, { status: 500 });
  }
}
