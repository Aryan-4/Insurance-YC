// Script to help set up Gemini API key
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Gemini API Setup Helper ===');
console.log('This script will help you set up your Gemini API key');
console.log('You can get a free API key from: https://makersuite.google.com/app/apikey\n');

rl.question('Please enter your Gemini API Key: ', (apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    console.log('No API key provided. Exiting...');
    rl.close();
    return;
  }

  const envContent = `# Gemini API key for LLM features
NEXT_PUBLIC_GEMINI_API_KEY=${apiKey.trim()}

# Optional configuration
LLM_MODEL=gemini-1.5-pro
`;

  try {
    fs.writeFileSync(path.join(__dirname, '.env.local'), envContent);
    console.log('\n✅ Success! API key has been saved to .env.local');
    console.log('You can now restart your Next.js server and test the API connection.');
  } catch (error) {
    console.error('Error saving API key:', error.message);
  }

  rl.close();
}); 