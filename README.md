# Insurance Claims Analyzer

A web application that extracts insured party names from claim documents and matches them against an internal database.

## Setup & Run Instructions

1. **Clone the repository**
   ```
   git clone <your-repo-url>
   cd insurance-yc
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Configure API key** (optional)
   - For enhanced extraction accuracy, obtain a Gemini API key from https://makersuite.google.com/app/apikey
   - Run the setup helper:
     ```
     node setup-gemini.js
     ```
   - Enter your API key when prompted
   - Without an API key, the app will fall back to regex-based extraction

4. **Start the development server**
   ```
   npm run dev
   ```

5. **Access the application**
   - Open http://localhost:3000 in your browser
   - Upload claim documents to extract and match insured parties
   - Use the "Test Matching Logic" section to test direct matching

## Architecture Notes

The application uses a Next.js frontend with a modular architecture that separates concerns into distinct components. Document processing begins with PDF text extraction, followed by insured party name extraction using either Gemini API (when configured) or regex pattern matching as a fallback. The extracted names are then matched against an internal database using Levenshtein distance algorithms to find the closest match, with confidence scores calculated based on string similarity. The UI provides a clear workflow for document processing and displays results with match confidence, allowing manual selection when automatic matching is uncertain.

# Insurance Claims Analyzer

## Setup & Run Instructions

1. **Install dependencies:** `npm install`
2. **Configure API key (optional):** 
   - Get Gemini API key from https://makersuite.google.com/app/apikey
   - Run `node setup-gemini.js` and enter your key when prompted
   - Without an API key, the app uses regex-based extraction
3. **Start development server:** `npm run dev`
4. **Access application:** Open http://localhost:3000

## Architecture Notes

The application uses Next.js with client-side processing to extract insured party names from uploaded claim documents and match them against an internal database. The extraction pipeline first uses PDF text extraction, then employs either Gemini API (when configured) or regex pattern matching as a fallback to identify insured names. These names are matched using Levenshtein distance algorithms with confidence scores based on string similarity. The modular architecture separates concerns into extraction, matching, and presentation layers, with a responsive UI that allows manual selection when automatic matching is uncertain.

## Prompt Design & LLM Usage

The application employs a carefully crafted system prompt for efficient entity extraction:

```
"You are an expert insurance-claim analyst. Return ONLY the primary insured entity's name from the supplied text. Respond with a raw string and no additional words."
```

This directive-style prompt was chosen for its clarity and specificity, instructing the model to:
1. Adopt a domain-specific expert role
2. Extract only the required information (insured entity name)
3. Return a clean output format without explanations or markdown

The implementation uses low temperature (0.1) to reduce variability and sets a modest token limit (100) to optimize costs while allowing sufficient space for entity names. A graceful degradation strategy automatically switches to regex-based extraction when API calls fail, preserving functionality while providing transparency about the extraction method used.

## Assumptions & Trade-offs

- **PDF Processing:** Assumes documents have extractable text; non-PDF or scanned images may not work properly
- **API Dependency:** Uses Gemini API for improved extraction quality but gracefully degrades to regex patterns when unavailable
- **Name Extraction:** Optimized for company names; may be less effective for individual names or unusual formats
- **Matching Algorithm:** Levenshtein distance provides good approximation but may produce false positives with similar names
- **Client-side Processing:** All processing stays in the browser with no server persistence, trading scalability for simplicity
- **Environment Variables:** API keys use NEXT_PUBLIC_* variables for demo purposes; a production app would need server-side API calls

## Assumptions & Trade-offs

- **PDF Processing**: We assume most documents will be PDFs with extractable text. Non-PDF documents or scanned images will require additional OCR processing (not implemented).
- **API Dependency**: When using LLM features, the app requires external API connectivity; however, it gracefully degrades to regex matching when APIs are unavailable.
- **Name Extraction**: We prioritized company name extraction patterns in regex fallbacks, which may be less effective for individual names or uncommon entity formats.
- **Confidence Calculation**: The Levenshtein distance algorithm provides a reasonable approximation of name matching, but could produce false positives with very similar company names.
