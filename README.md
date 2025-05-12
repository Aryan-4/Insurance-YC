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

## Assumptions & Trade-offs

- **PDF Processing**: We assume most documents will be PDFs with extractable text. Non-PDF documents or scanned images will require additional OCR processing (not implemented).
- **API Dependency**: When using LLM features, the app requires external API connectivity; however, it gracefully degrades to regex matching when APIs are unavailable.
- **Name Extraction**: We prioritized company name extraction patterns in regex fallbacks, which may be less effective for individual names or uncommon entity formats.
- **Confidence Calculation**: The Levenshtein distance algorithm provides a reasonable approximation of name matching, but could produce false positives with very similar company names.
- **Security**: API keys are stored in client-side environment variables (NEXT_PUBLIC_*), which is acceptable for a demo but would need server-side processing in production.
- **Browser Compatibility**: The application is optimized for modern browsers and may not function correctly in older versions. 