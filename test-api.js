// Simple Node.js script to test Anthropic API connectivity
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Get the API key from environment
const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
console.log('API key exists:', !!apiKey);
console.log('API key length:', apiKey?.length || 0);

// Minimal request to Anthropic API
const data = JSON.stringify({
  model: "claude-3-haiku-20240307",
  max_tokens: 10,
  messages: [
    { role: "user", content: "Hello" }
  ]
});

const options = {
  hostname: 'api.anthropic.com',
  path: '/v1/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'Content-Length': data.length
  }
};

console.log('Sending request to Anthropic API...');
const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Response:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end(); 