import { useState } from 'react'
import { Settings, Download, Moon, Sun, FileText, Trash2, Copy, Check, AlertCircle, Plus, X, Upload, Menu } from 'lucide-react'
import JSZip from 'jszip'
import { generateXml } from './utils/xmlGenerator'
import ImportModal from './components/ImportModal'

const INITIAL_FIELDS = [
  {
    id: '1',
    apiName: 'Sample_Text__c',
    label: 'Sample Text',
    type: 'Text',
    length: 255,
    required: false,
    trackHistory: false,
    externalId: false,
    unique: false,
    description: 'A sample text field to get you started'
  }
]

const FIELD_TYPES = [
  'Text', 'TextArea', 'LongTextArea', 'RichTextArea', 'Number', 'Currency', 
  'Percent', 'Checkbox', 'Date', 'DateTime', 'Email', 
  'Phone', 'Url', 'Picklist', 'MultiselectPicklist', 'Lookup', 'MasterDetail', 'Formula'
]

const DELETE_CONSTRAINTS = ['SetNull', 'Restrict', 'Cascade']


function EmptyState({ darkMode }) {
  return (
    <div style={{ 
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: darkMode ? '#64748b' : '#94a3b8'
    }}>
      <Settings size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
      <p style={{ fontSize: '1.125rem' }}>Select a field or add a new one to start</p>
    </div>
  )
}

function XmlPreview({ field, darkMode, onDownloadSingle }) {
  const [copied, setCopied] = useState(false)
  const xml = generateXml(field)

  const handleCopy = () => {
    navigator.clipboard.writeText(xml)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ 
        backgroundColor: '#1e293b',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #334155'
      }}>
        <div style={{ 
          backgroundColor: '#0f172a',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #334155'
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', color: '#94a3b8' }}>
            {field.apiName}.field-meta.xml
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              style={{
                padding: '6px 12px',
                backgroundColor: '#334155',
                color: copied ? '#22c55e' : '#cbd5e1',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={onDownloadSingle}
              style={{
                padding: '6px 12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
        <div style={{ padding: '20px', maxHeight: '600px', overflow: 'auto' }}>
          <pre style={{ 
            margin: 0, 
            fontFamily: 'monospace', 
            fontSize: '0.8125rem', 
            lineHeight: '1.6',
            color: '#93c5fd',
            whiteSpace: 'pre'
          }}>
            {xml}
          </pre>
        </div>
      </div>
    </div>
  )
}

function FieldEditor({ field, onChange, darkMode }) {
  const [errors, setErrors] = useState([])

  const handleChange = (key, value) => {
    const updated = { ...field, [key]: value }
    
    // If Lookup field is made required and deleteConstraint is SetNull, switch to Restrict
    if (field.type === 'Lookup' && key === 'required' && value === true && updated.deleteConstraint === 'SetNull') {
      updated.deleteConstraint = 'Restrict'
    }
    
    // If Lookup field deleteConstraint is SetNull, uncheck required
    if (field.type === 'Lookup' && key === 'deleteConstraint' && value === 'SetNull' && updated.required === true) {
      updated.required = false
    }
    
    onChange(updated)
    
    const newErrors = []
    if (!updated.apiName) newErrors.push('API Name is required')
    if (!updated.label) newErrors.push('Label is required')
    if (updated.type === 'Text' && (!updated.length || updated.length > 255)) {
      newErrors.push('Text length must be between 1 and 255')
    }
    if (['Lookup', 'MasterDetail'].includes(updated.type) && !updated.referenceTo) {
      newErrors.push('Reference To object is required for Lookup/MasterDetail fields')
    }
    if (updated.type === 'Formula' && !updated.formula) {
      newErrors.push('Formula expression is required')
    }
    setErrors(newErrors)
  }

  const handleAddPicklistValue = () => {
    const currentValues = field.picklistValues || []
    const updated = { 
      ...field, 
      picklistValues: [
        ...currentValues, 
        { fullName: '', label: '', default: false }
      ] 
    }
    onChange(updated)
  }

  const handleUpdatePicklistValue = (index, key, value) => {
    const updated = { ...field }
    updated.picklistValues[index][key] = value
    onChange(updated)
  }

  const handleRemovePicklistValue = (index) => {
    const updated = { ...field }
    updated.picklistValues.splice(index, 1)
    onChange(updated)
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${darkMode ? '#475569' : '#cbd5e1'}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#f1f5f9' : '#0f172a'
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 600,
    marginBottom: '8px',
    color: darkMode ? '#cbd5e1' : '#334155'
  }

  const checkboxContainerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    paddingTop: '8px'
  }

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '0.875rem'
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {errors.length > 0 && (
        <div style={{ 
          marginBottom: '24px', 
          padding: '16px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderLeft: '4px solid #ef4444',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 700, color: '#dc2626' }}>
            <AlertCircle size={20} />
            Validation Errors
          </div>
          <ul style={{ marginLeft: '20px', color: '#dc2626', fontSize: '0.875rem' }}>
            {errors.map((err, idx) => <li key={idx}>{err}</li>)}
          </ul>
        </div>
      )}

      <div style={{ 
        padding: '24px', 
        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '24px'
      }}>
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: 700, 
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
        }}>
          General Information
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <div>
            <label style={labelStyle}>
              Label <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => {
                const label = e.target.value
                handleChange('label', label)
                if (!field.apiName || field.apiName === field.label.replace(/\s+/g, '_') + '__c') {
                  handleChange('apiName', label.replace(/[^a-zA-Z0-9]/g, '_') + '__c')
                }
              }}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>
              API Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={field.apiName}
              onChange={(e) => handleChange('apiName', e.target.value)}
              style={{ ...inputStyle, fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={labelStyle}>
              Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={field.type}
              onChange={(e) => handleChange('type', e.target.value)}
              style={inputStyle}
            >
              {FIELD_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={checkboxContainerStyle}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) => handleChange('required', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Required</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.trackHistory || false}
                onChange={(e) => handleChange('trackHistory', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Track History</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.externalId || false}
                onChange={(e) => handleChange('externalId', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>External ID</span>
            </label>

            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.unique || false}
                onChange={(e) => handleChange('unique', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Unique</span>
            </label>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={field.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              style={{ ...inputStyle, minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Help Text</label>
            <textarea
              value={field.helpText || ''}
              onChange={(e) => handleChange('helpText', e.target.value)}
              placeholder="Inline help text that appears next to the field"
              style={{ ...inputStyle, minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* Type-Specific Configuration */}
      {(['Text', 'Email', 'Phone', 'Url'].includes(field.type)) && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            {field.type} Field Settings
          </h3>
          <div>
            <label style={labelStyle}>Length (1-255)</label>
            <input
              type="number"
              value={field.length || 255}
              onChange={(e) => handleChange('length', parseInt(e.target.value))}
              style={inputStyle}
              min="1"
              max="255"
            />
          </div>
        </div>
      )}

      {field.type === 'TextArea' && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            Text Area Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Length (1-255)</label>
              <input
                type="number"
                value={field.length || 255}
                onChange={(e) => handleChange('length', parseInt(e.target.value))}
                style={inputStyle}
                min="1"
                max="255"
              />
            </div>
            <div>
              <label style={labelStyle}>Visible Lines</label>
              <input
                type="number"
                value={field.visibleLines || 3}
                onChange={(e) => handleChange('visibleLines', parseInt(e.target.value))}
                style={inputStyle}
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>
      )}

      {(['LongTextArea', 'RichTextArea'].includes(field.type)) && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            {field.type} Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Length (1-131,072)</label>
              <input
                type="number"
                value={field.length || 32768}
                onChange={(e) => handleChange('length', parseInt(e.target.value))}
                style={inputStyle}
                min="1"
                max="131072"
              />
            </div>
            <div>
              <label style={labelStyle}>Visible Lines</label>
              <input
                type="number"
                value={field.visibleLines || 3}
                onChange={(e) => handleChange('visibleLines', parseInt(e.target.value))}
                style={inputStyle}
                min="1"
                max="50"
              />
            </div>
          </div>
        </div>
      )}

      {(['Number', 'Currency', 'Percent'].includes(field.type)) && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            {field.type} Field Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={labelStyle}>Precision (Total digits: 1-18)</label>
              <input
                type="number"
                value={field.precision || 18}
                onChange={(e) => handleChange('precision', parseInt(e.target.value))}
                style={inputStyle}
                min="1"
                max="18"
              />
            </div>
            <div>
              <label style={labelStyle}>Scale (Decimal places: 0-17)</label>
              <input
                type="number"
                value={field.scale || 2}
                onChange={(e) => handleChange('scale', parseInt(e.target.value))}
                style={inputStyle}
                min="0"
                max="17"
              />
            </div>
          </div>
        </div>
      )}

      {field.type === 'Checkbox' && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            Checkbox Settings
          </h3>
          <div>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.defaultValue === 'true' || field.defaultValue === true}
                onChange={(e) => handleChange('defaultValue', e.target.checked ? 'true' : 'false')}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Default Checked</span>
            </label>
          </div>
        </div>
      )}

      {(['Lookup', 'MasterDetail'].includes(field.type)) && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            {field.type} Relationship Settings
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
            <div>
              <label style={labelStyle}>
                Related To Object <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={field.referenceTo || ''}
                onChange={(e) => handleChange('referenceTo', e.target.value)}
                placeholder="Contact, Account, Custom_Object__c"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Relationship Name</label>
              <input
                type="text"
                value={field.relationshipName || ''}
                onChange={(e) => handleChange('relationshipName', e.target.value)}
                placeholder="Related_Records"
                style={{ ...inputStyle, fontFamily: 'monospace' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Relationship Label</label>
              <input
                type="text"
                value={field.relationshipLabel || ''}
                onChange={(e) => handleChange('relationshipLabel', e.target.value)}
                placeholder="Related Records"
                style={inputStyle}
              />
            </div>

            {field.type === 'Lookup' && (
              <div>
                <label style={labelStyle}>Delete Constraint</label>
                <select
                  value={field.deleteConstraint || 'SetNull'}
                  onChange={(e) => handleChange('deleteConstraint', e.target.value)}
                  style={inputStyle}
                  disabled={field.required === true}
                >
                  <option value="SetNull" disabled={field.required === true}>
                    SetNull {field.required === true ? '(unavailable - field is required)' : ''}
                  </option>
                  <option value="Restrict">Restrict</option>
                  <option value="Cascade">Cascade</option>
                </select>
                {field.required === true && field.deleteConstraint === 'SetNull' && (
                  <div style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '4px' }}>
                    âš ï¸ SetNull is not available for required fields. Switching to Restrict.
                  </div>
                )}
              </div>
            )}

            {field.type === 'MasterDetail' && (
              <>
                <div>
                  <label style={labelStyle}>Relationship Order</label>
                  <input
                    type="number"
                    value={field.relationshipOrder !== undefined ? field.relationshipOrder : 0}
                    onChange={(e) => handleChange('relationshipOrder', parseInt(e.target.value))}
                    style={inputStyle}
                    min="0"
                    max="1"
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={checkboxContainerStyle}>
                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={field.reparentableMasterDetail === 'true' || field.reparentableMasterDetail === true}
                        onChange={(e) => handleChange('reparentableMasterDetail', e.target.checked ? 'true' : 'false')}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>Allow Reparenting</span>
                    </label>

                    <label style={checkboxLabelStyle}>
                      <input
                        type="checkbox"
                        checked={field.writeRequiresMasterRead === 'true' || field.writeRequiresMasterRead === true}
                        onChange={(e) => handleChange('writeRequiresMasterRead', e.target.checked ? 'true' : 'false')}
                        style={{ width: '18px', height: '18px' }}
                      />
                      <span>Require Read Access on Master</span>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Lookup Filter (Optional - UI Only)</label>
              <textarea
                value={field.lookupFilter || ''}
                onChange={(e) => handleChange('lookupFilter', e.target.value)}
                placeholder="Enter lookup filter criteria (not included in XML)"
                style={{ ...inputStyle, minHeight: '60px', fontFamily: 'monospace', resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.75rem', color: darkMode ? '#94a3b8' : '#64748b', marginTop: '4px' }}>
                Note: Lookup filters are for your reference only and won't be included in the generated XML
              </div>
            </div>
          </div>
        </div>
      )}

      {field.type === 'Formula' && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem', 
            fontWeight: 700, 
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            Formula Settings
          </h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={labelStyle}>
                Formula Expression <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={field.formula || ''}
                onChange={(e) => handleChange('formula', e.target.value)}
                placeholder="Amount__c * 0.1"
                style={{ ...inputStyle, minHeight: '120px', fontFamily: 'monospace', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Return Type</label>
                <select
                  value={field.returnType || 'Text'}
                  onChange={(e) => handleChange('returnType', e.target.value)}
                  style={inputStyle}
                >
                  <option value="Text">Text</option>
                  <option value="Number">Number</option>
                  <option value="Currency">Currency</option>
                  <option value="Percent">Percent</option>
                  <option value="Date">Date</option>
                  <option value="DateTime">DateTime</option>
                  <option value="Checkbox">Checkbox</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Treat Blanks As</label>
                <select
                  value={field.treatBlanksAs || 'BlankAsZero'}
                  onChange={(e) => handleChange('treatBlanksAs', e.target.value)}
                  style={inputStyle}
                >
                  <option value="BlankAsZero">Blank as Zero</option>
                  <option value="BlankAsBlank">Blank as Blank</option>
                </select>
              </div>

              {(['Number', 'Currency', 'Percent'].includes(field.returnType)) && (
                <>
                  <div>
                    <label style={labelStyle}>Precision</label>
                    <input
                      type="number"
                      value={field.precision || 18}
                      onChange={(e) => handleChange('precision', parseInt(e.target.value))}
                      style={inputStyle}
                      min="1"
                      max="18"
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Scale</label>
                    <input
                      type="number"
                      value={field.scale || 2}
                      onChange={(e) => handleChange('scale', parseInt(e.target.value))}
                      style={inputStyle}
                      min="0"
                      max="17"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {(['Picklist', 'MultiselectPicklist'].includes(field.type)) && (
        <div style={{ 
          padding: '24px', 
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
          }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
              Picklist Values
            </h3>
            <button
              onClick={handleAddPicklistValue}
              style={{
                padding: '6px 12px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={16} />
              Add Value
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={field.restricted !== false}
                onChange={(e) => handleChange('restricted', e.target.checked)}
                style={{ width: '18px', height: '18px' }}
              />
              <span>Restricted Picklist (limit to defined values only)</span>
            </label>
          </div>

          {field.type === 'MultiselectPicklist' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Visible Lines</label>
              <input
                type="number"
                value={field.visibleLines || 6}
                onChange={(e) => handleChange('visibleLines', parseInt(e.target.value))}
                style={inputStyle}
                min="3"
                max="10"
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(field.picklistValues || []).map((pv, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: darkMode ? '#0f172a' : '#f8fafc',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'end' }}>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.75rem' }}>API Name</label>
                    <input
                      type="text"
                      value={pv.fullName || ''}
                      onChange={(e) => handleUpdatePicklistValue(index, 'fullName', e.target.value)}
                      placeholder="Value_1"
                      style={{ ...inputStyle, fontSize: '0.8125rem', padding: '8px 10px' }}
                    />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, fontSize: '0.75rem' }}>Label</label>
                    <input
                      type="text"
                      value={pv.label || ''}
                      onChange={(e) => handleUpdatePicklistValue(index, 'label', e.target.value)}
                      placeholder="Value 1"
                      style={{ ...inputStyle, fontSize: '0.8125rem', padding: '8px 10px' }}
                    />
                  </div>
                  <label style={{ ...checkboxLabelStyle, fontSize: '0.75rem', paddingBottom: '8px' }}>
                    <input
                      type="checkbox"
                      checked={pv.default || false}
                      onChange={(e) => handleUpdatePicklistValue(index, 'default', e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    <span>Default</span>
                  </label>
                  <button
                    onClick={() => handleRemovePicklistValue(index)}
                    style={{
                      padding: '8px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#ef4444',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '8px'
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}

            {(!field.picklistValues || field.picklistValues.length === 0) && (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: darkMode ? '#64748b' : '#94a3b8',
                fontSize: '0.875rem'
              }}>
                No picklist values added yet. Click "Add Value" to get started.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Tabs({ activeTab, onTabChange, darkMode }) {
  const styles = {
    tabs: {
      display: 'flex',
      gap: '24px',
      padding: '0 24px',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      backgroundColor: darkMode ? '#1e293b' : '#ffffff'
    },
    tab: (active) => ({
      padding: '12px 0',
      fontSize: '0.875rem',
      fontWeight: 600,
      color: active ? '#2563eb' : (darkMode ? '#94a3b8' : '#64748b'),
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
      transition: 'all 0.2s'
    })
  }

  return (
    <div style={styles.tabs}>
      <button style={styles.tab(activeTab === 'editor')} onClick={() => onTabChange('editor')}>
        Configuration
      </button>
      <button style={styles.tab(activeTab === 'preview')} onClick={() => onTabChange('preview')}>
        XML Preview
      </button>
    </div>
  )
}

function Header({ onDownload, darkMode, onToggleDark, onToggleSidebar, isMobile }) {
  const styles = {
    header: {
      padding: '16px 24px',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: darkMode ? '#1e293b' : '#ffffff'
    },
    left: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logo: {
      width: '40px',
      height: '40px',
      backgroundColor: '#2563eb',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white'
    },
    title: {
      fontSize: '1.125rem',
      fontWeight: 700
    },
    subtitle: {
      fontSize: '0.75rem',
      color: darkMode ? '#94a3b8' : '#64748b'
    },
    right: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: darkMode ? '#334155' : '#0f172a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    iconButton: {
      padding: '8px',
      border: 'none',
      background: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: darkMode ? '#f59e0b' : '#6366f1'
    },
    hamburger: {
      padding: '8px',
      border: 'none',
      background: 'none',
      color: darkMode ? '#f1f5f9' : '#0f172a',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      marginRight: '8px'
    }
  }

  return (
    <div style={styles.header}>
      <div style={styles.left}>
        {isMobile && (
          <button 
            onClick={onToggleSidebar}
            style={styles.hamburger}
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>
        )}
        <div style={styles.logo}>
          <Settings size={24} />
        </div>
        <div>
          <div style={styles.title}>Salesforce Architect</div>
          <div style={styles.subtitle}>Metadata Engine ⚙️🛠️</div>
        </div>
      </div>
      <div style={styles.right}>
        <button style={styles.button} onClick={onDownload}>
          <Download size={16} />
          Download
        </button>
        <button style={styles.iconButton} onClick={onToggleDark}>
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </div>
  )
}

function FieldItem({ field, isSelected, onSelect, onDelete, darkMode }) {
  const [showDelete, setShowDelete] = useState(false)

  const styles = {
    item: {
      padding: '12px',
      margin: '4px 0',
      backgroundColor: isSelected 
        ? (darkMode ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff')
        : (darkMode ? '#334155' : '#ffffff'),
      border: isSelected ? '1px solid #2563eb' : '1px solid transparent',
      borderRadius: '8px',
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      transition: 'all 0.2s'
    },
    info: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    textInfo: {
      flex: 1,
      minWidth: 0
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 600,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      color: isSelected ? '#2563eb' : 'inherit'
    },
    apiName: {
      fontSize: '0.75rem',
      color: darkMode ? '#94a3b8' : '#64748b',
      fontFamily: 'monospace',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },
    requiredStar: {
      fontSize: '1rem',
      color: '#ef4444',
      fontWeight: 'bold',
      lineHeight: 1,
      flexShrink: 0
    },
    deleteButton: {
      padding: '6px',
      border: 'none',
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#ef4444',
      borderRadius: '4px',
      cursor: 'pointer',
      opacity: showDelete ? 1 : 0,
      transition: 'opacity 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }

  return (
    <div 
      style={styles.item}
      onClick={onSelect}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div style={styles.info}>
        <div style={styles.textInfo}>
          <div style={styles.label}>{field.label || 'Unnamed Field'}</div>
          <div style={styles.apiName}>{field.apiName}</div>
        </div>
        {field.required && (
          <span style={styles.requiredStar} title="Required Field">â˜…</span>
        )}
      </div>
      <button 
        style={styles.deleteButton}
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

function Sidebar({ fields, allFields, selectedId, onSelect, onDelete, onAdd, onImport, darkMode, fieldTypeFilter, onFilterChange, generalCount, lookupCount, formulaCount, onDownloadByCategory, isOpen, onClose, isMobile }) {
  const styles = {
    sidebar: {
      width: isMobile ? '280px' : '320px',
      borderRight: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: darkMode ? '#1e293b' : '#ffffff',
      ...(isMobile && {
        position: 'fixed',
        top: 0,
        left: isOpen ? 0 : '-280px',
        bottom: 0,
        zIndex: 1000,
        transition: 'left 0.3s ease',
        boxShadow: isOpen ? '2px 0 8px rgba(0,0,0,0.2)' : 'none'
      })
    },
    header: {
      padding: '16px',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`
    },
    title: {
      fontSize: '0.75rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      color: darkMode ? '#94a3b8' : '#64748b',
      marginBottom: '12px',
      letterSpacing: '0.05em'
    },
    addButton: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      marginBottom: '8px'
    },
    importButton: {
      width: '100%',
      padding: '8px 16px',
      backgroundColor: darkMode ? '#334155' : '#0f172a',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    filterTabs: {
      padding: '12px 16px',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    },
    filterButton: (active) => ({
      padding: '8px 12px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: active ? '#2563eb' : (darkMode ? '#334155' : '#f1f5f9'),
      color: active ? 'white' : (darkMode ? '#cbd5e1' : '#475569'),
      transition: 'all 0.2s'
    }),
    badge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 700
    },
    list: {
      flex: 1,
      overflow: 'auto',
      padding: '8px'
    },
    footer: {
      padding: '12px',
      borderTop: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      textAlign: 'center',
      fontSize: '0.75rem',
      color: darkMode ? '#64748b' : '#94a3b8'
    },
    downloadCategoryBtn: {
      width: '100%',
      padding: '6px 12px',
      marginTop: '8px',
      backgroundColor: darkMode ? '#065f46' : '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      cursor: 'pointer',
      display: fieldTypeFilter !== 'all' ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px'
    },
    mobileHeader: {
      padding: '12px',
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e2e8f0'}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    closeButton: {
      padding: '4px',
      border: 'none',
      background: 'none',
      color: darkMode ? '#cbd5e1' : '#64748b',
      cursor: 'pointer',
      fontSize: '24px'
    }
  }

  const getCategoryLabel = () => {
    switch(fieldTypeFilter) {
      case 'general': return 'General'
      case 'lookup': return 'Lookup'
      case 'formula': return 'Formula'
      default: return 'All'
    }
  }

  return (
    <>
      {isMobile && isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      
      <div style={styles.sidebar}>
        {isMobile && (
          <div style={styles.mobileHeader}>
            <span style={{ fontWeight: 600 }}>Menu</span>
            <button onClick={onClose} style={styles.closeButton}>×</button>
          </div>
        )}
        
        <div style={styles.header}>
          <div style={styles.title}>Field Definitions</div>
          <button style={styles.addButton} onClick={onAdd}>
            <FileText size={16} />
            Add New Field
          </button>
          <button style={styles.importButton} onClick={onImport}>
            <Upload size={16} />
            Import JSON
          </button>
        </div>

        <div style={styles.filterTabs}>
          <button 
            style={styles.filterButton(fieldTypeFilter === 'all')} 
            onClick={() => onFilterChange('all')}
          >
            <span>🗃️ All Fields</span>
            <span style={styles.badge}>{allFields.length}</span>
          </button>
          <button 
            style={styles.filterButton(fieldTypeFilter === 'general')} 
            onClick={() => onFilterChange('general')}
          >
            <span>🗂️ General</span>
            <span style={styles.badge}>{generalCount}</span>
          </button>
          <button 
            style={styles.filterButton(fieldTypeFilter === 'lookup')} 
            onClick={() => onFilterChange('lookup')}
          >
            <span>🔗 Lookup</span>
            <span style={styles.badge}>{lookupCount}</span>
          </button>
          <button 
            style={styles.filterButton(fieldTypeFilter === 'formula')} 
            onClick={() => onFilterChange('formula')}
          >
            <span>🧮 Formula</span>
            <span style={styles.badge}>{formulaCount}</span>
          </button>
          
          <button 
            style={styles.downloadCategoryBtn}
            onClick={() => onDownloadByCategory(fieldTypeFilter)}
          >
            <Download size={14} />
            Download {getCategoryLabel()}
          </button>
        </div>

        <div style={styles.list}>
          {fields.map(field => (
            <FieldItem
              key={field.id}
              field={field}
              isSelected={field.id === selectedId}
              onSelect={() => onSelect(field.id)}
              onDelete={() => onDelete(field.id)}
              darkMode={darkMode}
            />
          ))}
        </div>

        <div style={styles.footer}>
          {fields.length} {fieldTypeFilter === 'all' ? 'Total' : getCategoryLabel()} Field{fields.length !== 1 ? 's' : ''}
        </div>
      </div>
    </>
  )
}

function App() {
  const [fields, setFields] = useState(INITIAL_FIELDS)
  const [selectedId, setSelectedId] = useState('1')
  const [activeTab, setActiveTab] = useState('editor')
  const [showImportModal, setShowImportModal] = useState(false)
  const [fieldTypeFilter, setFieldTypeFilter] = useState('all')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode')
      if (saved === null) return true
      return saved === 'true'
    }
    return true
  })
  
  // NEW: Mobile state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // NEW: Detect mobile screen size
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const selectedField = fields.find(f => f.id === selectedId)

  const generalFields = fields.filter(f => !['Lookup', 'MasterDetail', 'Formula'].includes(f.type))
  const lookupFields = fields.filter(f => ['Lookup', 'MasterDetail'].includes(f.type))
  const formulaFields = fields.filter(f => f.type === 'Formula')

  const getFilteredFields = () => {
    switch(fieldTypeFilter) {
      case 'general': return generalFields
      case 'lookup': return lookupFields
      case 'formula': return formulaFields
      default: return fields
    }
  }

  const filteredFields = getFilteredFields()

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', newMode)
  }

  const handleAddField = () => {
    const newField = {
      id: Date.now().toString(),
      apiName: 'New_Field__c',
      label: 'New Field',
      type: 'Text',
      length: 255,
      required: false,
      trackHistory: false,
      externalId: false,
      unique: false
    }
    setFields([...fields, newField])
    setSelectedId(newField.id)
    setActiveTab('editor')
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleDeleteField = (id) => {
    const newFields = fields.filter(f => f.id !== id)
    setFields(newFields)
    if (selectedId === id) {
      setSelectedId(newFields.length > 0 ? newFields[0].id : null)
    }
  }

  const handleUpdateField = (updatedField) => {
    setFields(fields.map(f => f.id === updatedField.id ? updatedField : f))
  }

  // NEW: Close sidebar when selecting field on mobile
  const handleSelectField = (id) => {
    setSelectedId(id)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleDownload = async () => {
    const zip = new JSZip()
    const folder = zip.folder('fields')
    
    fields.forEach(field => {
      const xml = generateXml(field)
      folder.file(`${field.apiName}.field-meta.xml`, xml)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = 'salesforce-fields.zip'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadByCategory = async (category) => {
    let fieldsToDownload = []
    let filename = ''

    switch(category) {
      case 'general':
        fieldsToDownload = generalFields
        filename = 'general-fields.zip'
        break
      case 'lookup':
        fieldsToDownload = lookupFields
        filename = 'lookup-fields.zip'
        break
      case 'formula':
        fieldsToDownload = formulaFields
        filename = 'formula-fields.zip'
        break
      default:
        return
    }

    if (fieldsToDownload.length === 0) {
      alert(`No ${category} fields to download`)
      return
    }

    const zip = new JSZip()
    const folder = zip.folder('fields')
    
    fieldsToDownload.forEach(field => {
      const xml = generateXml(field)
      folder.file(`${field.apiName}.field-meta.xml`, xml)
    })

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadSingleField = (field) => {
    const xml = generateXml(field)
    const blob = new Blob([xml], { type: 'text/xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${field.apiName}.field-meta.xml`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportJSON = (jsonData) => {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      
      if (!data.fields || !Array.isArray(data.fields)) {
        alert('Invalid JSON format. Expected { "fields": [...] }')
        return
      }

      const importedFields = data.fields.map((field, index) => ({
        ...field,
        id: Date.now().toString() + index,
        required: field.required || false,
        trackHistory: field.trackHistory || false,
        externalId: field.externalId || false,
        unique: field.unique || false
      }))

      setFields(importedFields)
      if (importedFields.length > 0) {
        setSelectedId(importedFields[0].id)
      }
      setShowImportModal(false)
      setActiveTab('editor')
    } catch (error) {
      alert('Error parsing JSON: ' + error.message)
    }
  }

  const rootStyles = {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: darkMode ? '#020617' : '#f1f5f9',
    color: darkMode ? '#f1f5f9' : '#0f172a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  }

  const contentStyles = {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  }

  return (
    <div style={rootStyles}>
      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportJSON}
          darkMode={darkMode}
        />
      )}

      <Header 
        onDownload={handleDownload}
        darkMode={darkMode}
        onToggleDark={toggleDarkMode}
        onToggleSidebar={() => setSidebarOpen(true)}
        isMobile={isMobile}
      />

      <div style={contentStyles}>
        <Sidebar 
          fields={filteredFields}
          allFields={fields}
          selectedId={selectedId}
          onSelect={handleSelectField}
          onDelete={handleDeleteField}
          onAdd={handleAddField}
          onImport={() => setShowImportModal(true)}
          darkMode={darkMode}
          fieldTypeFilter={fieldTypeFilter}
          onFilterChange={setFieldTypeFilter}
          generalCount={generalFields.length}
          lookupCount={lookupFields.length}
          formulaCount={formulaFields.length}
          onDownloadByCategory={handleDownloadByCategory}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          isMobile={isMobile}
        />

        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0,
          overflow: 'hidden'
        }}>
          {selectedField ? (
            <>
              <Tabs 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                darkMode={darkMode}
              />

              <div style={{ 
                flex: 1, 
                overflow: 'auto', 
                padding: '24px',
                backgroundColor: darkMode ? '#0f172a' : '#f8fafc'
              }}>
                {activeTab === 'editor' ? (
                  <FieldEditor 
                    field={selectedField}
                    onChange={handleUpdateField}
                    darkMode={darkMode}
                  />
                ) : (
                  <XmlPreview 
                    field={selectedField}
                    darkMode={darkMode}
                    onDownloadSingle={() => handleDownloadSingleField(selectedField)}
                  />
                )}
              </div>
            </>
          ) : (
            <EmptyState darkMode={darkMode} />
          )}
        </div>
      </div>
    </div>
  )
}


export default App
