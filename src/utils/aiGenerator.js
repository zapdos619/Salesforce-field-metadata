/**
 * AI Generator Utility
 * Handles AI-powered field generation with smart preprocessing
 * Enhanced with: Character normalization, Description support, Smart document cutoff
 */

/**
 * Normalize all problematic Unicode characters to standard ASCII
 * Fixes smart quotes, curly apostrophes, special dashes, etc.
 */
export function normalizeCharacters(text) {
  if (!text) return text;
  
  return text
    // Smart quotes → straight quotes
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // ""„‟″‶ → "
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")  // ''‚‛′‵ → '
    
    // Apostrophes (all variants)
    .replace(/[\u02BC\u055A\u07F4\u07F5]/g, "'")             // ʼ՚ߴߵ → '
    
    // Dashes (all types → regular hyphen)
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // ‐‑‒–—― → -
    
    // Spaces (all special spaces → regular space)
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    
    // Ellipsis
    .replace(/[\u2026]/g, '...')                             // … → ...
    
    // Quotation marks (all types)
    .replace(/[\u00AB\u00BB\u2039\u203A]/g, '"')            // «»‹› → "
    
    // Bullet points → regular dash
    .replace(/[\u2022\u2023\u2043\u204C\u204D\u2219]/g, '-') // •‣⁃⁌⁍∙ → -
    
    // Remove zero-width characters
    .replace(/[\u200B-\u200D\uFEFF]/g, '')                   // Zero-width spaces
    
    // Normalize line breaks
    .replace(/\r\n/g, '\n')                                   // Windows → Unix
    .replace(/\r/g, '\n')                                     // Old Mac → Unix
    
    // Remove BOM (Byte Order Mark)
    .replace(/^\uFEFF/, '');
}

/**
 * Smart cutoff - Remove sections after field definitions end
 * Detects: Validation Rules, Page Layouts, Workflows, Reports, etc.
 */
export function cutoffAfterFields(text) {
  const cutoffMarkers = [
    /^#{1,3}\s+\*?\*?Validation\s+Rules?/im,
    /^#{1,3}\s+\*?\*?Page\s+Layouts?/im,
    /^#{1,3}\s+\*?\*?Record\s+Types?/im,
    /^#{1,3}\s+\*?\*?Workflows?/im,
    /^#{1,3}\s+\*?\*?Process\s+Builder/im,
    /^#{1,3}\s+\*?\*?Flows?/im,
    /^#{1,3}\s+\*?\*?Apex\s+(Triggers?|Classes?)/im,
    /^#{1,3}\s+\*?\*?Lightning\s+Components?/im,
    /^#{1,3}\s+\*?\*?Reports?\s+(and|&)?\s+Dashboards?/im,
    /^#{1,3}\s+\*?\*?Integration/im,
    /^#{1,3}\s+\*?\*?Security/im,
    /^#{1,3}\s+\*?\*?Permissions?/im,
    /^#{1,3}\s+\*?\*?Best\s+Practices/im,
  ];

  let cutoffPosition = text.length;

  // Find the earliest cutoff marker
  for (const marker of cutoffMarkers) {
    const match = text.match(marker);
    if (match && match.index < cutoffPosition) {
      cutoffPosition = match.index;
    }
  }

  if (cutoffPosition < text.length) {
    const cutText = text.substring(0, cutoffPosition);
    const reduction = ((1 - cutoffPosition / text.length) * 100).toFixed(1);
    console.log(`✂️  Cut off non-field sections: ${reduction}% reduction`);
    return cutText;
  }

  return text;
}

/**
 * Enhanced field extraction with smart preprocessing
 */
export function extractFieldSpecifications(text) {
  if (!text || text.trim().length === 0) return text;

  // STEP 1: Normalize characters FIRST (critical for Treatment Plan format)
  console.log('🔄 Normalizing characters...');
  text = normalizeCharacters(text);

  // STEP 2: Smart cutoff - remove non-field sections
  text = cutoffAfterFields(text);

  // STEP 3: If document is small, return as-is
  if (text.length < 3000) {
    console.log('📄 Small document, using full text');
    return text;
  }

  console.log('📄 Large document detected, extracting field specifications...');

  const lines = text.split('\n');
  const relevantSections = [];
  let currentSection = [];
  let sectionScore = 0;
  let inHighValueSection = false;

  const highValueKeywords = [
    'field label', 'field type', 'field name', 'api name', 'apiname',
    'lookup', 'formula', 'picklist', 'master-detail', 'master detail',
    'help text', 'description', 'relationship', 'precision', 'scale', 
    'referenceto', 'reference to'
  ];

  const mediumValueKeywords = [
    'field', 'type:', 'label:', 'required:', 'help:', 'values:',
    'formula:', 'relationship:', 'length:', 'default:', '__c',
    'data type:', 'description:'
  ];

  const sectionMarkers = ['##', '###', '**', '####'];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase().trim();
    const isNewSection = sectionMarkers.some(marker => line.trim().startsWith(marker));

    if (isNewSection) {
      if (sectionScore >= 2 && currentSection.length > 0) {
        relevantSections.push(currentSection.join('\n'));
      }
      
      currentSection = [line];
      sectionScore = 0;
      inHighValueSection = false;

      const headerContainsFieldInfo = 
        lowerLine.includes('field') || lowerLine.includes('specification') ||
        lowerLine.includes('requirement') || lowerLine.includes('data model') ||
        lowerLine.includes('schema') || lowerLine.includes('__c') ||
        lowerLine.includes('relationship');

      if (headerContainsFieldInfo) {
        sectionScore += 3;
        inHighValueSection = true;
      }
      continue;
    }

    let lineScore = 0;
    if (highValueKeywords.some(kw => lowerLine.includes(kw))) {
      lineScore += 3;
      inHighValueSection = true;
    }
    if (mediumValueKeywords.some(kw => lowerLine.includes(kw))) lineScore += 2;
    if (line.match(/^\s*[-*•]\s+.*:/)) lineScore += 2;
    if (line.includes('__c')) lineScore += 2;
    if (line.match(/^[-*•]\s+(.*)\s*\(default\)/i)) lineScore += 2;
    if (line.match(/\|\s*\w+\s*\|/)) lineScore += 1;

    currentSection.push(line);
    sectionScore += lineScore;

    if (line.trim().length === 0 && !inHighValueSection && sectionScore < 1 && currentSection.length > 3) {
      currentSection = [];
      sectionScore = 0;
    }
  }

  if (sectionScore >= 2 && currentSection.length > 0) {
    relevantSections.push(currentSection.join('\n'));
  }

  const extracted = relevantSections.join('\n\n').trim();

  if (extracted.length < 100) {
    console.log('⚠️  Extraction too aggressive, using original text');
    return text;
  }

  const reductionPct = ((1 - extracted.length / text.length) * 100).toFixed(1);
  console.log(`✅ Extracted ${extracted.length} chars from ${text.length} chars (${reductionPct}% reduction)`);
  
  return extracted;
}

/**
 * Enhanced prompt with description support and better character handling
 */
export function generatePrompt(fieldSpec) {
  return `CRITICAL INSTRUCTIONS:
1. Your response MUST start with { and end with }
2. Return ONLY valid JSON - no text before or after
3. Do NOT use markdown code blocks or backticks
4. NORMALIZE all special characters (smart quotes → straight quotes)

You are converting Salesforce field specifications to JSON format.

REQUIRED JSON STRUCTURE:
{
  "objectName": "Custom_Object__c",
  "fields": [
    {
      "apiName": "Field_Name__c",
      "label": "Field Label",
      "type": "Text",
      "length": 255,
      "required": false,
      "trackHistory": false,
      "externalId": false,
      "unique": false,
      
      "helpText": "Extract from 'Help Text:' label if present",
      "description": "Extract from 'Description:' label if present"
    }
  ]
}

METADATA EXTRACTION RULES:
1. **Help Text**: Look for explicit "Help Text:" label ONLY
   - Extract the text that follows "Help Text:"
   - Keep it concise (inline help for users)

2. **Description**: Look for explicit "Description:" label ONLY
   - Extract the text that follows "Description:"
   - This is for detailed field documentation

3. **Keep Separate**: If both helpText and description exist, include BOTH as separate fields

4. **Character Normalization**: 
   - Convert ALL smart quotes (""'') to straight quotes ("')
   - Convert ALL special dashes (–—) to regular hyphens (-)
   - Remove any Unicode characters that break JSON

FIELD TYPE REFERENCE:
- Text/Email/Phone/Url: type="Text"/"Email"/"Phone"/"Url", include "length" (max 255)
- TextArea: type="TextArea", "length" (max 255), "visibleLines"
- LongTextArea: type="LongTextArea", "length" (max 131072), "visibleLines"
- RichTextArea: type="RichTextArea", "length" (max 131072), "visibleLines"
- Number/Currency/Percent: type="Number"/"Currency"/"Percent", "precision", "scale"
- Checkbox: type="Checkbox", "defaultValue" (true/false)
- Date: type="Date"
- DateTime: type="DateTime"
- Picklist: type="Picklist", "picklistValues": [{"fullName":"Value1", "label":"Value 1", "default":false}], "restricted":true
- MultiselectPicklist: type="MultiselectPicklist", same as Picklist + "visibleLines"
- Lookup: type="Lookup", "referenceTo", "relationshipName", "relationshipLabel", "deleteConstraint" (SetNull/Restrict/Cascade)
- MasterDetail: type="MasterDetail", same as Lookup + "relationshipOrder", "reparentableMasterDetail", "writeRequiresMasterRead"
- Formula: type="Formula", "formula", "returnType", "treatBlanksAs", and if numeric: "precision", "scale"

CONVERSION RULES:
1. Extract ALL fields from the specification
2. Use boolean values without quotes: true or false
3. Use sensible defaults for missing information
4. Infer field types from context (e.g., "email" → type:"Email")
5. For Lookup fields, if deleteConstraint is SetNull and required is true, use Restrict instead
6. If objectName not specified, use "Custom_Object__c"
7. Extract helpText and description as separate fields when present

Field Specifications:
${fieldSpec}

Remember: 
- Return ONLY the JSON object, starting with { and ending with }
- Include both helpText and description if they exist in the spec
- Normalize ALL special characters to standard ASCII`;
}

/**
 * Enhanced AI generation with character normalization and better error handling
 */
export async function generateFieldsFromAI(inputText) {
  if (!inputText || inputText.trim().length === 0) {
    throw new Error('Please provide field specification text');
  }

  // Normalize input text before extraction
  inputText = normalizeCharacters(inputText);
  
  const fieldSpec = extractFieldSpecifications(inputText);
  const prompt = generatePrompt(fieldSpec);

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('No response from AI. Please try again.');
    }

    let generatedText = data.candidates[0].content.parts[0].text.trim();
    
    // Normalize AI response (in case it included special characters)
    generatedText = normalizeCharacters(generatedText);
    
    // Remove markdown code blocks
    generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const firstBrace = generatedText.indexOf('{');
    const lastBrace = generatedText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('AI response did not contain valid JSON structure');
    }

    generatedText = generatedText.substring(firstBrace, lastBrace + 1);

    try {
      const parsed = JSON.parse(generatedText);
      if (!parsed.fields || !Array.isArray(parsed.fields)) {
        throw new Error('Invalid JSON structure: missing or invalid "fields" array');
      }
      
      console.log(`✅ Successfully generated ${parsed.fields.length} fields`);
      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Generated text:', generatedText.substring(0, 500));
      throw new Error('AI returned invalid JSON. Please try again with clearer specifications.');
    }
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      throw new Error('Network error: Could not connect to AI service.');
    }
    throw error;
  }
}
