import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { POST } from './route';

// Ensure NVIDIA_API_KEY is available in process.env
if (!process.env.NVIDIA_API_KEY) {
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const match = envContent.match(/NVIDIA_API_KEY=(.+)/);
    if (match) {
      process.env.NVIDIA_API_KEY = match[1].trim();
    }
  }
  if (!process.env.NVIDIA_API_KEY) {
    const rootEnvPath = path.join(process.cwd(), '..', '.env');
    if (fs.existsSync(rootEnvPath)) {
      const envContent = fs.readFileSync(rootEnvPath, 'utf8');
      const match = envContent.match(/NVIDIA_API_KEY=(.+)/);
      if (match) {
        process.env.NVIDIA_API_KEY = match[1].trim();
      }
    }
  }
}

test('POST handler returns 429 when OpenAI throws rate limit error', async () => {
  const originalCreate = OpenAI.Chat.Completions.prototype.create;
  try {
    OpenAI.Chat.Completions.prototype.create = async function () {
      const err: any = new Error('Rate limit exceeded');
      err.status = 429;
      throw err;
    } as any;

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Rate limit test' }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 429);
    const data = await res.json();
    assert.strictEqual(data.status, 'rate_limit');
    assert.strictEqual(data.message, 'Queueing request...');
  } finally {
    OpenAI.Chat.Completions.prototype.create = originalCreate;
  }
});

test('POST handler returns 500 when generic error occurs', async () => {
  const originalCreate = OpenAI.Chat.Completions.prototype.create;
  try {
    OpenAI.Chat.Completions.prototype.create = async function () {
      throw new Error('Server error');
    } as any;

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Server error test' }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 500);
    const data = await res.json();
    assert.strictEqual(data.status, 'error');
    assert.strictEqual(data.message, 'Server error');
  } finally {
    OpenAI.Chat.Completions.prototype.create = originalCreate;
  }
});

test('POST handler successfully queries NVIDIA model and returns answer', async () => {
  const req = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Summarize the codebase structure in one short sentence.' }),
  });

  const res = await POST(req);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'success');
  assert.ok(typeof data.message === 'string');
  assert.ok(data.message.length > 0);
});
