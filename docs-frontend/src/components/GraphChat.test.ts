import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';

test('GraphChat component file exists and exports default function', async () => {
  const componentPath = path.join(process.cwd(), 'src', 'components', 'GraphChat.tsx');
  assert.ok(fs.existsSync(componentPath), 'GraphChat.tsx file should exist');

  const content = fs.readFileSync(componentPath, 'utf8');
  assert.ok(content.includes('export default function GraphChat'), 'GraphChat.tsx should export default function GraphChat');
  assert.ok(content.includes('"use client"'), 'GraphChat.tsx should have "use client" directive');
});

test('RootLayout incorporates GraphChat component', async () => {
  const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx');
  const content = fs.readFileSync(layoutPath, 'utf8');
  assert.ok(/import GraphChat from ['"]@\/components\/GraphChat['"]/.test(content), 'layout.tsx should import GraphChat');
  assert.ok(content.includes('<GraphChat />'), 'layout.tsx should render <GraphChat />');
});

test('GraphChat code renderer handles react-markdown v10 inline code and error handling', async () => {
  const componentPath = path.join(process.cwd(), 'src', 'components', 'GraphChat.tsx');
  const content = fs.readFileSync(componentPath, 'utf8');
  assert.ok(content.includes('isInline'), 'GraphChat.tsx should compute isInline explicitly');
  assert.ok(!content.includes('inline,'), 'GraphChat.tsx should not rely on destructured inline prop from react-markdown v10');
  assert.ok(content.includes('data.error'), 'GraphChat.tsx should check data.error from API response');
});

