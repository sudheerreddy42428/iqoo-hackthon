import fetch from 'node-fetch';

async function test() {
  const pollinationsRes = await fetch('https://text.pollinations.ai/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{role: 'system', content: 'You are a bot'}, {role: 'user', content: 'test'}]
    })
  });
  console.log('status', pollinationsRes.status);
  const text = await pollinationsRes.text();
  console.log('body', text);
}
test();
