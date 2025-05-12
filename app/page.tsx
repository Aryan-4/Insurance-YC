'use client';

import { useState, useEffect } from 'react';
import Dropzone from '@/components/Dropzone';
import ResultsTable, { ParsedFile } from '@/components/ResultsTable';
import { batchFilesToText } from '@/lib/parser';
import { extractInsured } from '@/lib/llm';
import { matchInsured, INSUREDS } from '@/lib/match';
import '../styles/globals.css';

const MatchTester = () => {
  const [inputName, setInputName] = useState('Riley HealthCare LLC');
  const [matchResult, setMatchResult] = useState<ReturnType<typeof matchInsured> | null>(null);
  const [apiStatus, setApiStatus] = useState<'untested' | 'testing' | 'working' | 'not-working'>('untested');
  const apiKeyLength = process.env.NEXT_PUBLIC_GEMINI_API_KEY ? process.env.NEXT_PUBLIC_GEMINI_API_KEY.length : 0;
  
  const testMatch = () => {
    if (!inputName.trim()) return;
    const result = matchInsured(inputName);
    setMatchResult(result);
    console.log('Direct match test result:', result);
  };
  
  const testGeminiApi = async () => {
    setApiStatus('testing');
    try {
      // Log if API key exists
      console.log('API key exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      console.log('API key length:', process.env.NEXT_PUBLIC_GEMINI_API_KEY?.length || 0);
      
      // Import the Google Generative AI SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      
      // Initialize the Gemini client
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      // Make a simple test request
      const result = await model.generateContent('Hello, test request');
      
      if (result) {
        setApiStatus('working');
        console.log('Gemini API is WORKING!', result.response.text());
      } else {
        setApiStatus('not-working');
        console.error('Gemini API returned no result');
      }
    } catch (error) {
      setApiStatus('not-working');
      console.error('Gemini API connection failed:', error);
    }
  };
  
  return (
    <div className="match-tester">
      <h3>Test Matching Logic</h3>
      <div className="tester-controls">
        <input 
          type="text" 
          value={inputName} 
          onChange={(e) => setInputName(e.target.value)} 
          placeholder="Enter company name to test" 
        />
        <button onClick={testMatch}>Test Match</button>
      </div>
      {matchResult && (
        <div className="match-result">
          <p>Input: <strong>{inputName}</strong></p>
          <p>Matched name: <strong>{matchResult.insuredName}</strong></p>
          <p>Internal ID: <strong>{matchResult.internalId || 'No match'}</strong></p>
          <p>Confidence: <strong>{(matchResult.confidence * 100)}%</strong></p>
        </div>
      )}
      
      <div style={{ marginTop: '1rem', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={testGeminiApi}>Test Gemini API Connection</button>
          <div>
            Status: <span style={{ 
              fontWeight: 'bold',
              color: apiStatus === 'working' ? 'green' : 
                     apiStatus === 'not-working' ? 'red' : 
                     apiStatus === 'testing' ? 'orange' : 'gray'
            }}>
              {apiStatus === 'untested' ? 'Not Tested' : 
               apiStatus === 'testing' ? 'Testing...' : 
               apiStatus === 'working' ? 'WORKING ✓' : 'NOT WORKING ✗'}
            </span>
          </div>
          <div>API Key Length: {apiKeyLength}</div>
        </div>
        {apiStatus === 'not-working' && (
          <p style={{ color: 'red', margin: '0.5rem 0 0' }}>Check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local</p>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [rows, setRows] = useState<ParsedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  // Handler for when files are dropped or selected
  const handleFiles = async (files: File[]) => {
    // Reset any previous error messages
    setErrorMessage(null);
    setIsProcessing(true);
    
    console.log(`Processing ${files.length} files:`, files.map(f => `${f.name} (${f.type}, ${f.size} bytes)`).join(', '));
    
    // Step 1: Add files to the rows with 'uploaded' status
    const newRows = files.map((file): ParsedFile => ({
      name: file.name,
      status: 'uploaded'
    }));
    
    // Use a functional update to ensure we're using the latest state
    const initialRowsLength = rows.length;
    setRows(prev => [...prev, ...newRows]);
    
    try {
      // Step 2: Process files to extract text
      const textResults = await batchFilesToText(files);
      
      // Process each file's text extraction result
      for (let i = 0; i < textResults.length; i++) {
        const { file, text, error } = textResults[i];
        const rowIndex = initialRowsLength + i;
        
        console.log(`File ${i+1}/${textResults.length}: ${file.name} - ${text ? 'Text extracted successfully' : 'Failed to extract text'}`);
        
        // Update status to 'processing' or 'error' if text extraction failed
        if (error || !text) {
          console.error(`Error extracting text from ${file.name}:`, error);
          setRows(prev => {
            const updated = [...prev];
            updated[rowIndex] = {
              ...updated[rowIndex],
              status: 'error',
              error: error || 'Failed to extract text'
            };
            return updated;
          });
          
          // Show the error message
          setErrorMessage(`Failed to extract text from ${file.name}: ${error || 'Unknown error'}`);
          continue;
        }
        
        // Update to processing state
        setRows(prev => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            status: 'processing'
          };
          return updated;
        });
        
        try {
          // Step 3: Extract insured name with LLM
          console.log(`Extracting insured name from ${file.name}`);
          const insuredName = await extractInsured(text);
          console.log(`Extracted insured name: "${insuredName}"`);
          
          // Step 4: Match against internal database
          console.log(`Matching extracted name "${insuredName}" against INSUREDS database`);
          const matchResult = matchInsured(insuredName);
          console.log(`Match result:`, matchResult);
          console.log(`Match result details - insuredName: ${matchResult.insuredName}, internalId: ${matchResult.internalId || 'none'}, confidence: ${matchResult.confidence}`);
          
          // Step 5: Update row with results
          setRows(prev => {
            const updated = [...prev];
            if (rowIndex < updated.length) {
              const updatedRow: ParsedFile = {
                ...updated[rowIndex],
                insuredName: matchResult.insuredName,
                internalId: matchResult.internalId,
                confidence: matchResult.confidence,
                status: 'done'
              };
              updated[rowIndex] = updatedRow;
              console.log(`Updated row ${rowIndex} with:`, updatedRow);
            }
            return updated;
          });
          
          console.log(`Processing complete for ${file.name}: Insured: ${matchResult.insuredName}, ID: ${matchResult.internalId || 'none'}, Confidence: ${(matchResult.confidence * 100).toFixed(2)}%`);
        } catch (processingError) {
          // Handle errors during processing
          const errorMsg = processingError instanceof Error 
            ? processingError.message 
            : 'Error processing file';
            
          console.error(`Error processing ${file.name}:`, errorMsg);
          
          setRows(prev => {
            const updated = [...prev];
            updated[rowIndex] = {
              ...updated[rowIndex],
              status: 'error',
              error: errorMsg
            };
            return updated;
          });
          
          // Show the error message
          setErrorMessage(`Error processing ${file.name}: ${errorMsg}`);
        }
      }
    } catch (batchError) {
      // Handle errors from batch processing
      const errorMsg = batchError instanceof Error 
        ? batchError.message 
        : 'Error processing files';
      
      console.error('Batch processing error:', errorMsg);
      setErrorMessage(`Error processing files: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler for manual selection of insured party
  const handleManualSelect = (rowIdx: number, internalId: string) => {
    const selectedInsured = INSUREDS.find(insured => insured.internalId === internalId);
    
    if (selectedInsured) {
      console.log(`Manual selection for row ${rowIdx}: Selected "${selectedInsured.name}" (${internalId})`);
      
      setRows(prev => {
        const updated = [...prev];
        updated[rowIdx] = {
          ...updated[rowIdx],
          insuredName: selectedInsured.name,
          internalId: selectedInsured.internalId,
          confidence: 1.0, // Manual selection has 100% confidence
          status: 'done'
        };
        return updated;
      });
    }
  };

  // Toggle debug panel with "d" key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd') {
        setShowDebug(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return (
    <main className="container">
      <h1>Insurance Claims Analyzer</h1>
      
      {/* Direct matching test component */}
      <MatchTester />
      
      <hr />
      
      {/* Error message display (toast-like) */}
      {errorMessage && (
        <div className="error-toast">
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage(null)}>✕</button>
        </div>
      )}
      
      <section className="upload-section">
        <h2>Upload Claims</h2>
        <Dropzone onFiles={handleFiles} />
        {isProcessing && (
          <div className="processing-indicator">
            <p>Processing files... Please wait.</p>
          </div>
        )}
      </section>
      
      <section className="results-section">
        <h2>Analysis Results</h2>
        <ResultsTable 
          rows={rows} 
          onManualSelect={handleManualSelect} 
        />
      </section>

      {showDebug && (
        <div className="debug-panel">
          <h4>Debug Panel (press 'd' to toggle)</h4>
          <p>INSUREDS count: {INSUREDS.length}</p>
          <p>First 3 INSUREDS:</p>
          <ul>
            {INSUREDS.slice(0, 3).map(ins => (
              <li key={ins.internalId}>{ins.internalId}: {ins.name}</li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
} 