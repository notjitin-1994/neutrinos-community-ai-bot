import test from 'node:test';
import assert from 'node:assert';
import OpenAI from 'openai';
import { POST } from './route';

test('POST handler returns 400 when message is missing or empty', async () => {
  const req1 = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  const res1 = await POST(req1);
  assert.strictEqual(res1.status, 400);
  const data1 = await res1.json();
  assert.strictEqual(data1.error, 'Message is required');

  const req2 = new Request('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' }),
  });

  const res2 = await POST(req2);
  assert.strictEqual(res2.status, 400);
  const data2 = await res2.json();
  assert.strictEqual(data2.error, 'Message is required');
});

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

test('POST handler routes with 8B model and generates with 70B model using mocked OpenAI', async () => {
  const originalCreate = OpenAI.Chat.Completions.prototype.create;
  const calls: { model: string; messages: any[] }[] = [];

  try {
    OpenAI.Chat.Completions.prototype.create = (async function (params: any) {
      calls.push({ model: params.model, messages: params.messages });

      if (params.model === 'meta/llama-3.1-8b-instruct') {
        return {
          choices: [
            {
              message: {
                content: JSON.stringify(['src/neutrinos_bot/generator.py']),
              },
            },
          ],
        };
      }

      if (params.model === 'meta/llama-3.1-70b-instruct') {
        return {
          choices: [
            {
              message: {
                content: 'Mocked 70B generator answer based on pruned context.',
              },
            },
          ],
        };
      }

      throw new Error(`Unexpected model: ${params.model}`);
    }) as any;

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'How does generator work?' }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(
      data.message,
      'Mocked 70B generator answer based on pruned context.'
    );

    // Verify two calls were made: 8b routing and 70b generation
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[0].model, 'meta/llama-3.1-8b-instruct');
    assert.strictEqual(calls[1].model, 'meta/llama-3.1-70b-instruct');

    // Verify 70b prompt context contains generator.py and not unselected files
    const systemPrompt70b = calls[1].messages.find((m: any) => m.role === 'system')?.content || '';
    assert.ok(systemPrompt70b.includes('src/neutrinos_bot/generator.py'));
    assert.ok(!systemPrompt70b.includes('src/neutrinos_bot/sla_monitor.py'));
  } finally {
    OpenAI.Chat.Completions.prototype.create = originalCreate;
  }
});

test('POST handler safely handles missing content in completion choices', async () => {
  const originalCreate = OpenAI.Chat.Completions.prototype.create;
  try {
    OpenAI.Chat.Completions.prototype.create = (async function (params: any) {
      if (params.model === 'meta/llama-3.1-8b-instruct') {
        return {
          choices: [{ message: { content: '[]' } }],
        };
      }
      return { choices: [] };
    }) as any;

    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test empty completion' }),
    });

    const res = await POST(req);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, 'success');
    assert.strictEqual(data.message, "Sorry, I couldn't generate a response.");
  } finally {
    OpenAI.Chat.Completions.prototype.create = originalCreate;
  }
});
