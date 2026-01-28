/**
 * AI Generator Utility
 * Handles AI-powered field generation with smart preprocessing
 */

export function extractFieldSpecifications(text) {
  if (!text || text.trim().length === 0) return text;
  if (text.length < 3000) return text;

  console.log('📄 Large document detected, extracting field specifications...');

  const lines = text.split('\n');
  const relevantSections = [];
  let currentSection = [];
  let sectionScore = 0;
  let inHighValueSection = false;

  const highValueKeywords = [
    'field label', 'field type', 'field name', 'api name', 'apiname',
    'lookup', 'formula', 'picklist', 'master-detail', 'master detail',
    'help text', 'relationship', 'precision', 'scale', 'referenceto', 'reference to'
  ];

  const mediumValueKeywords = [
    'field', 'type:', 'label:', 'required:', 'help:', 'values:',
    'formula:', 'relationship:', 'length:', 'default:', '__c'
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
        lowerLine.includes('schema') || lowerLine.includes('__c');

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

export function generatePrompt(fieldSpec) {
  return `CRITICAL INSTRUCTIONS:
1. Your response MUST start with { and end with }
2. Return ONLY valid JSON - no text before or after
3. Do NOT use markdown code blocks or backticks

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
      "unique": false
    }
  ]
}

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

Field Specifications:
${fieldSpec}

Remember: Return ONLY the JSON object, starting with { and ending with }`;
}

export async function generateFieldsFromAI(inputText) {
  if (!inputText || inputText.trim().length === 0) {
    throw new Error('Please provide field specification text');
  }

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
      return parsed;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('AI returned invalid JSON. Please try again with clearer specifications.');
    }
  } catch (error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      throw new Error('Network error: Could not connect to AI service.');
    }
    throw error;
  }
}
