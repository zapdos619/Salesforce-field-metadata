import { useState } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import { generateFieldsFromAI } from '../utils/aiGenerator';
import { parseFile, isValidFileType, isValidFileSize, getFileTypeName, formatFileSize } from '../utils/fileParser';

export default function ImportModal({ onClose, onImport, darkMode }) {
  const [jsonText, setJsonText] = useState('');
  const [activeMethod, setActiveMethod] = useState('paste');
  const [aiInput, setAiInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [generationProgress, setGenerationProgress] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);
        onImport(jsonData);
      } catch (error) {
        setError('Invalid JSON file: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  const handleAiFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');
    setGenerationProgress('');

    if (!isValidFileType(file)) {
      setError(`Unsupported file type. Please upload .txt, .md, or .docx files.`);
      return;
    }

    if (!isValidFileSize(file, 10)) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
      return;
    }

    setGenerationProgress(`Reading ${getFileTypeName(file)}...`);
    setUploadedFileName(file.name);

    try {
      const text = await parseFile(file);
      setAiInput(text);
      setGenerationProgress('');
      setUploadedFileName(file.name);
    } catch (error) {
      setError(error.message);
      setGenerationProgress('');
      setUploadedFileName('');
    }
  };

  const handleAiGenerate = async () => {
    if (!aiInput.trim()) {
      setError('Please provide field specification text or upload a file');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress('Analyzing field specifications...');
    setError('');

    try {
      setGenerationProgress('Processing with AI...');
      const result = await generateFieldsFromAI(aiInput);
      setGenerationProgress('Converting to JSON...');
      const jsonString = JSON.stringify(result, null, 2);
      setJsonText(jsonString);
      setGenerationProgress('✅ Generation complete!');
      setTimeout(() => {
        setActiveMethod('paste');
        setGenerationProgress('');
      }, 1000);
    } catch (error) {
      setGenerationProgress('');
      let errorMessage = error.message;
      if (error.message.includes('invalid JSON') || error.message.includes('parse')) {
        errorMessage += '\n\n💡 Suggestions:\n• Try simplifying your field descriptions\n• Remove special characters';
      }
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaste = () => {
    if (!jsonText.trim()) {
      setError('Please paste JSON content');
      return;
    }
    setError('');
    try {
      const parsed = JSON.parse(jsonText);
      onImport(parsed);
    } catch (parseError) {
      setError('Invalid JSON format: ' + parseError.message);
    }
  };

  const clearError = () => setError('');

  const overlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: darkMode ? '#1e293b' : '#ffffff', borderRadius: '16px',
    padding: '32px', maxWidth: '800px', width: '90%', maxHeight: '90vh',
    overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '12px 24px', border: 'none',
    background: active ? '#2563eb' : 'transparent',
    color: active ? 'white' : (darkMode ? '#94a3b8' : '#64748b'),
    cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
    borderRadius: '8px', transition: 'all 0.2s'
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileJson size={28} style={{ color: '#2563eb' }} />
            Import Fields from JSON
          </h2>
          <button onClick={onClose} style={{
            width: '32px', height: '32px', borderRadius: '50%', border: 'none',
            background: darkMode ? '#334155' : '#f1f5f9', color: darkMode ? '#94a3b8' : '#64748b',
            cursor: 'pointer', fontSize: '1.25rem', fontWeight: 'bold'
          }}>×</button>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px', backgroundColor: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
            border: `1px solid ${darkMode ? '#dc2626' : '#fecaca'}`, borderRadius: '8px',
            marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
          }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ flex: 1, fontSize: '0.875rem', color: '#dc2626', whiteSpace: 'pre-line' }}>{error}</div>
            <button onClick={clearError} style={{
              background: 'none', border: 'none', color: '#dc2626',
              cursor: 'pointer', fontSize: '1.25rem', lineHeight: 1, padding: 0
            }}>×</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', padding: '4px', backgroundColor: darkMode ? '#334155' : '#f1f5f9', borderRadius: '12px' }}>
          <button style={tabStyle(activeMethod === 'ai')} onClick={() => { setActiveMethod('ai'); clearError(); }}>
            <span style={{ marginRight: '8px' }}>✨</span>AI Generate
          </button>
          <button style={tabStyle(activeMethod === 'paste')} onClick={() => { setActiveMethod('paste'); clearError(); }}>
            <span style={{ marginRight: '8px' }}>💾</span>Paste JSON
          </button>
          <button style={tabStyle(activeMethod === 'upload')} onClick={() => { setActiveMethod('upload'); clearError(); }}>
            <span style={{ marginRight: '8px' }}>📤</span>Upload File
          </button>
        </div>

        {activeMethod === 'ai' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: darkMode ? '#cbd5e1' : '#334155' }}>
              Paste field specification or upload file:
            </label>
            
            {uploadedFileName && (
              <div style={{
                padding: '8px 12px', backgroundColor: darkMode ? '#0f172a' : '#f0f9ff',
                border: `1px solid ${darkMode ? '#334155' : '#bfdbfe'}`, borderRadius: '6px',
                marginBottom: '12px', fontSize: '0.75rem', color: darkMode ? '#93c5fd' : '#1e40af',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <CheckCircle size={16} style={{ color: '#10b981' }} />
                <span>Loaded: {uploadedFileName}</span>
              </div>
            )}
            
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Paste field specifications here...\n\nExample:\n- Patient Name (Lookup to Contact, Required)\n- Lab Order Date (Date, Required)\n- Test Results (Long Text, 5000 chars)"
              style={{
                width: '100%', minHeight: '300px', padding: '12px',
                border: `2px solid ${darkMode ? '#475569' : '#cbd5e1'}`, borderRadius: '8px',
                fontSize: '0.875rem', backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                color: darkMode ? '#f1f5f9' : '#0f172a', resize: 'vertical',
                marginBottom: '12px', fontFamily: 'inherit'
              }}
            />
            
            <div style={{ marginBottom: '16px' }}>
              <input type="file" accept=".md,.txt,.doc,.docx" onChange={handleAiFileUpload}
                style={{ display: 'none' }} id="aiFileInput" />
              <label htmlFor="aiFileInput" style={{
                display: 'inline-block', padding: '8px 16px',
                backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                color: darkMode ? '#cbd5e1' : '#334155', borderRadius: '6px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer'
              }}>📄 Upload File (.txt, .md, .docx)</label>
            </div>

            {generationProgress && (
              <div style={{
                padding: '12px', backgroundColor: darkMode ? '#0f172a' : '#eff6ff',
                border: `1px solid ${darkMode ? '#1e40af' : '#bfdbfe'}`, borderRadius: '8px',
                marginBottom: '16px', fontSize: '0.875rem', color: darkMode ? '#93c5fd' : '#1e40af',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <span>⏳</span><span>{generationProgress}</span>
              </div>
            )}

            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                color: darkMode ? '#cbd5e1' : '#334155'
              }}>Cancel</button>
              <button onClick={handleAiGenerate} disabled={isGenerating || !aiInput.trim()} style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: isGenerating || !aiInput.trim() ? 'not-allowed' : 'pointer',
                backgroundColor: isGenerating || !aiInput.trim() ? '#94a3b8' : '#7c3aed',
                color: 'white', display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isGenerating || !aiInput.trim() ? 0.6 : 1
              }}>
                {isGenerating ? '⏳ Generating...' : '✨ Generate JSON'}
              </button>
            </div>
          </div>
        )}

        {activeMethod === 'paste' && (
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px', color: darkMode ? '#cbd5e1' : '#334155' }}>
              Paste your JSON here:
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder='{\n  "objectName": "Lab_Result__c",\n  "fields": [\n    {\n      "apiName": "Test_Name__c",\n      "label": "Test Name",\n      "type": "Text",\n      "length": 255,\n      "required": true\n    }\n  ]\n}'
              style={{
                width: '100%', minHeight: '300px', padding: '12px',
                border: `2px solid ${darkMode ? '#475569' : '#cbd5e1'}`, borderRadius: '8px',
                fontSize: '0.875rem', fontFamily: 'monospace',
                backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                color: darkMode ? '#f1f5f9' : '#0f172a', resize: 'vertical'
              }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                color: darkMode ? '#cbd5e1' : '#334155'
              }}>Cancel</button>
              <button onClick={handlePaste} disabled={!jsonText.trim()} style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600,
                cursor: !jsonText.trim() ? 'not-allowed' : 'pointer',
                backgroundColor: !jsonText.trim() ? '#94a3b8' : '#2563eb',
                color: 'white', opacity: !jsonText.trim() ? 0.6 : 1
              }}>Import Fields</button>
            </div>
          </div>
        )}

        {activeMethod === 'upload' && (
          <div>
            <div style={{
              border: `2px dashed ${darkMode ? '#475569' : '#cbd5e1'}`, borderRadius: '12px',
              padding: '48px 24px', textAlign: 'center',
              backgroundColor: darkMode ? '#0f172a' : '#f8fafc'
            }}>
              <Upload size={48} style={{ margin: '0 auto 16px', color: '#2563eb' }} />
              <p style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Upload JSON File</p>
              <p style={{ fontSize: '0.875rem', color: darkMode ? '#94a3b8' : '#64748b', marginBottom: '16px' }}>
                Click to browse or drag and drop
              </p>
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} id="jsonFileInput" />
              <label htmlFor="jsonFileInput" style={{
                display: 'inline-block', padding: '10px 24px', backgroundColor: '#2563eb',
                color: 'white', borderRadius: '8px', fontSize: '0.875rem',
                fontWeight: 600, cursor: 'pointer'
              }}>Choose File</label>
            </div>
            <div style={{ marginTop: '16px', textAlign: 'right' }}>
              <button onClick={onClose} style={{
                padding: '10px 24px', border: 'none', borderRadius: '8px',
                fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                backgroundColor: darkMode ? '#334155' : '#e2e8f0',
                color: darkMode ? '#cbd5e1' : '#334155'
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
