import { useState, useEffect } from 'react';
import { Upload, FileJson, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
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
  
  // NEW: Enhanced progress tracking
  const [progressDetails, setProgressDetails] = useState({
    step: 0,
    totalSteps: 4,
    currentTask: '',
    estimatedTimeRemaining: 0
  });
  
  // NEW: Partial success handling
  const [partialResult, setPartialResult] = useState(null);
  const [generationStartTime, setGenerationStartTime] = useState(0);

  // NEW: Calculate estimated time remaining
  useEffect(() => {
    if (isGenerating && generationStartTime > 0) {
      const interval = setInterval(() => {
        const elapsed = (Date.now() - generationStartTime) / 1000; // seconds
        const avgTimePerStep = elapsed / Math.max(progressDetails.step, 1);
        const stepsRemaining = progressDetails.totalSteps - progressDetails.step;
        const estimated = Math.ceil(avgTimePerStep * stepsRemaining);
        
        setProgressDetails(prev => ({
          ...prev,
          estimatedTimeRemaining: Math.max(0, estimated)
        }));
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isGenerating, progressDetails.step, generationStartTime, progressDetails.totalSteps]);

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
    setGenerationProgress('Starting generation...');
    setError('');
    setPartialResult(null);
    setGenerationStartTime(Date.now());
    
    // Reset progress
    setProgressDetails({
      step: 0,
      totalSteps: 4,
      currentTask: 'Initializing...',
      estimatedTimeRemaining: 0
    });

    try {
      // Step 1: Normalize characters
      setProgressDetails({
        step: 1,
        totalSteps: 4,
        currentTask: 'Normalizing special characters...',
        estimatedTimeRemaining: 15
      });
      setGenerationProgress('Step 1/4: Normalizing text...');
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI
      
      // Step 2: Extract field specifications
      setProgressDetails({
        step: 2,
        totalSteps: 4,
        currentTask: 'Extracting field specifications...',
        estimatedTimeRemaining: 12
      });
      setGenerationProgress('Step 2/4: Analyzing document structure...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 3: Process with AI
      setProgressDetails({
        step: 3,
        totalSteps: 4,
        currentTask: 'Processing with AI (this may take 10-20 seconds)...',
        estimatedTimeRemaining: 10
      });
      setGenerationProgress('Step 3/4: AI is generating fields...');
      
      const result = await generateFieldsFromAI(aiInput);
      
      // Step 4: Converting to JSON
      setProgressDetails({
        step: 4,
        totalSteps: 4,
        currentTask: 'Converting to JSON...',
        estimatedTimeRemaining: 2
      });
      setGenerationProgress('Step 4/4: Finalizing...');
      
      const jsonString = JSON.stringify(result, null, 2);
      setJsonText(jsonString);
      
      // Success!
      setProgressDetails({
        step: 4,
        totalSteps: 4,
        currentTask: 'Complete!',
        estimatedTimeRemaining: 0
      });
      setGenerationProgress(`✅ Successfully generated ${result.fields.length} fields!`);
      
      setTimeout(() => {
        setActiveMethod('paste');
        setGenerationProgress('');
        setProgressDetails({
          step: 0,
          totalSteps: 4,
          currentTask: '',
          estimatedTimeRemaining: 0
        });
      }, 1500);
      
    } catch (error) {
      setGenerationProgress('');
      setProgressDetails({
        step: 0,
        totalSteps: 4,
        currentTask: '',
        estimatedTimeRemaining: 0
      });
      
      let errorMessage = error.message;
      
      // Check if we have any partial results
      if (jsonText && jsonText.length > 0) {
        setPartialResult({
          json: jsonText,
          error: errorMessage
        });
        errorMessage = `Generation partially completed. ${errorMessage}\n\n✅ Some fields were generated. You can import them below or retry.`;
      } else {
        if (error.message.includes('invalid JSON') || error.message.includes('parse')) {
          errorMessage += '\n\n💡 Suggestions:\n• Try simplifying your field descriptions\n• Remove special characters\n• Break into smaller sections';
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setGenerationStartTime(0);
    }
  };

  // NEW: Retry with same input
  const handleRetry = () => {
    setError('');
    setPartialResult(null);
    handleAiGenerate();
  };

  // NEW: Import partial results
  const handleImportPartial = () => {
    if (partialResult && partialResult.json) {
      try {
        const parsed = JSON.parse(partialResult.json);
        onImport(parsed);
      } catch (error) {
        setError('Could not parse partial results: ' + error.message);
      }
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

  const clearError = () => {
    setError('');
    setPartialResult(null);
  };

  // NEW: Format time remaining
  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Finishing...';
    if (seconds < 60) return `~${seconds}s remaining`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `~${mins}m ${secs}s remaining`;
  };

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

        {/* NEW: Partial results actions */}
        {partialResult && (
          <div style={{
            padding: '12px 16px', backgroundColor: darkMode ? 'rgba(234, 179, 8, 0.1)' : '#fefce8',
            border: `1px solid ${darkMode ? '#ca8a04' : '#fde047'}`, borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '0.875rem', color: darkMode ? '#fbbf24' : '#ca8a04', marginBottom: '12px' }}>
              <strong>Partial Success:</strong> Some fields were generated successfully.
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleImportPartial} style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                backgroundColor: '#22c55e', color: 'white',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <CheckCircle size={14} />
                Import What We Got
              </button>
              <button onClick={handleRetry} style={{
                padding: '6px 12px', border: 'none', borderRadius: '6px',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                backgroundColor: '#3b82f6', color: 'white',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <RefreshCw size={14} />
                Retry Generation
              </button>
            </div>
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

            {/* NEW: Enhanced progress display with time estimate */}
            {generationProgress && (
              <div style={{
                padding: '16px', backgroundColor: darkMode ? '#0f172a' : '#eff6ff',
                border: `1px solid ${darkMode ? '#1e40af' : '#bfdbfe'}`, borderRadius: '8px',
                marginBottom: '16px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    color: darkMode ? '#93c5fd' : '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span>⏳</span>
                    <span>{generationProgress}</span>
                  </div>
                  {progressDetails.estimatedTimeRemaining > 0 && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: darkMode ? '#60a5fa' : '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Clock size={12} />
                      <span>{formatTime(progressDetails.estimatedTimeRemaining)}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress bar */}
                {progressDetails.step > 0 && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: darkMode ? '#1e3a8a' : '#dbeafe',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(progressDetails.step / progressDetails.totalSteps) * 100}%`,
                        height: '100%',
                        backgroundColor: '#3b82f6',
                        transition: 'width 0.3s ease',
                        borderRadius: '4px'
                      }} />
                    </div>
                    <div style={{
                      fontSize: '0.6875rem',
                      color: darkMode ? '#93c5fd' : '#1e40af',
                      marginTop: '4px'
                    }}>
                      {progressDetails.currentTask}
                    </div>
                  </div>
                )}
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
