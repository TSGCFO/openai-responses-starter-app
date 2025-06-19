// Simple test to verify the tools generation fix
const { getTools } = require('./lib/tools/tools.ts');

// Test scenarios
console.log('Testing tools generation with various vector store configurations...\n');

// Mock the tools store for testing
const mockStore = {
  getState: () => ({
    webSearchEnabled: false,
    fileSearchEnabled: true,
    functionsEnabled: false,
    codeInterpreterEnabled: false,
    vectorStore: null, // This should cause the original bug
    webSearchConfig: {},
    mcpEnabled: false,
    mcpConfig: {},
    mcpServers: [],
  })
};

// Test 1: null vector store (should not include file search tool)
console.log('Test 1: null vector store');
try {
  const tools = getTools();
  console.log('Generated tools:', JSON.stringify(tools, null, 2));
  
  const fileSearchTool = tools.find(tool => tool.type === 'file_search');
  if (fileSearchTool) {
    console.error('❌ FAIL: File search tool should not be included when vector store is null');
  } else {
    console.log('✅ PASS: No file search tool when vector store is null');
  }
} catch (error) {
  console.error('❌ ERROR:', error.message);
}

console.log('\n' + '='.repeat(50) + '\n');

// Test 2: valid vector store (should include file search tool)
console.log('Test 2: valid vector store');
mockStore.getState = () => ({
  webSearchEnabled: false,
  fileSearchEnabled: true,
  functionsEnabled: false,
  codeInterpreterEnabled: false,
  vectorStore: { id: 'vs_123', name: 'Test Store' },
  webSearchConfig: {},
  mcpEnabled: false,
  mcpConfig: {},
  mcpServers: [],
});

try {
  const tools = getTools();
  console.log('Generated tools:', JSON.stringify(tools, null, 2));
  
  const fileSearchTool = tools.find(tool => tool.type === 'file_search');
  if (fileSearchTool && fileSearchTool.vector_store_ids.includes('vs_123')) {
    console.log('✅ PASS: File search tool included with valid vector store ID');
  } else {
    console.error('❌ FAIL: File search tool should be included with valid vector store');
  }
} catch (error) {
  console.error('❌ ERROR:', error.message);
}

console.log('\nTest completed!');