const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'
const XML_NAMESPACE = 'http://soap.sforce.com/2006/04/metadata'

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function buildTag(name, value, indent = '    ') {
  if (value === undefined || value === null || value === '') return ''
  return `${indent}<${name}>${escapeXml(value)}</${name}>`
}

export function generateXml(field) {
  const parts = []
  
  parts.push(XML_HEADER)
  parts.push(`<CustomField xmlns="${XML_NAMESPACE}">`)
  
  // fullName (always first)
  parts.push(buildTag('fullName', field.apiName))
  
  // defaultValue for Checkbox (before other fields)
  if (field.type === 'Checkbox') {
    parts.push(buildTag('defaultValue', field.defaultValue || 'false'))
  }
  
  // deleteConstraint for Lookup
  if (field.type === 'Lookup' && field.deleteConstraint) {
    parts.push(buildTag('deleteConstraint', field.deleteConstraint))
  }
  
  // externalId (always include true or false)
  if (field.externalId !== undefined) {
    parts.push(buildTag('externalId', field.externalId === true ? 'true' : 'false'))
  }
  
  // formula (for Formula fields only)
  if (field.type === 'Formula' && field.formula) {
    parts.push(buildTag('formula', field.formula))
  }
  
  // formulaTreatBlanksAs (for Formula fields)
  if (field.type === 'Formula') {
    parts.push(buildTag('formulaTreatBlanksAs', field.treatBlanksAs || 'BlankAsZero'))
  }
  
  // inlineHelpText
  if (field.helpText) {
    parts.push(buildTag('inlineHelpText', field.helpText))
  }
  
  // label
  parts.push(buildTag('label', field.label))
  
  // length (for Text, Email, Phone, Url, TextArea fields)
  if (['Text', 'Email', 'Phone', 'Url', 'TextArea'].includes(field.type) && field.length) {
    parts.push(buildTag('length', field.length))
  }
  
  // length for LongTextArea and RichTextArea (different max)
  if (['LongTextArea', 'RichTextArea'].includes(field.type) && field.length) {
    parts.push(buildTag('length', field.length))
  }
  
  // visibleLines for TextArea, LongTextArea, RichTextArea
  if (['TextArea', 'LongTextArea', 'RichTextArea'].includes(field.type) && field.visibleLines) {
    parts.push(buildTag('visibleLines', field.visibleLines))
  }
  
  // precision (for Number, Currency, Percent, and Formula with numeric return)
  if (['Number', 'Currency', 'Percent'].includes(field.type) || 
      (field.type === 'Formula' && ['Number', 'Currency', 'Percent'].includes(field.returnType))) {
    parts.push(buildTag('precision', field.precision || 18))
  }
  
  // referenceTo (for Lookup and MasterDetail)
  if (['Lookup', 'MasterDetail'].includes(field.type) && field.referenceTo) {
    parts.push(buildTag('referenceTo', field.referenceTo))
  }
  
  // relationshipLabel (for Lookup and MasterDetail)
  if (['Lookup', 'MasterDetail'].includes(field.type) && field.relationshipLabel) {
    parts.push(buildTag('relationshipLabel', field.relationshipLabel))
  }
  
  // relationshipName (for Lookup and MasterDetail)
  if (['Lookup', 'MasterDetail'].includes(field.type) && field.relationshipName) {
    parts.push(buildTag('relationshipName', field.relationshipName))
  }
  
  // relationshipOrder (for MasterDetail only)
  if (field.type === 'MasterDetail') {
    parts.push(buildTag('relationshipOrder', field.relationshipOrder !== undefined ? field.relationshipOrder : 0))
  }
  
  // reparentableMasterDetail (for MasterDetail only)
  if (field.type === 'MasterDetail') {
    parts.push(buildTag('reparentableMasterDetail', field.reparentableMasterDetail !== undefined ? field.reparentableMasterDetail : 'false'))
  }
  
  // required (ALWAYS include as true or false, skip for MasterDetail)
  if (field.type !== 'MasterDetail') {
    parts.push(buildTag('required', field.required === true ? 'true' : 'false'))
  }
  
  // scale (for Number, Currency, Percent, and Formula with numeric return)
  if (['Number', 'Currency', 'Percent'].includes(field.type) || 
      (field.type === 'Formula' && ['Number', 'Currency', 'Percent'].includes(field.returnType))) {
    parts.push(buildTag('scale', field.scale !== undefined ? field.scale : 2))
  }
  
  // trackHistory (ALWAYS include as true or false)
  parts.push(buildTag('trackHistory', field.trackHistory === true ? 'true' : 'false'))
  
  // type (NOTE: Formula fields use the returnType as the type tag)
  if (field.type === 'Formula') {
    parts.push(buildTag('type', field.returnType || 'Text'))
  } else {
    parts.push(buildTag('type', field.type))
  }
  
  // unique (always include true or false)
  if (field.unique !== undefined) {
    parts.push(buildTag('unique', field.unique === true ? 'true' : 'false'))
  }
  
  // valueSet (for Picklist and MultiselectPicklist)
  if (['Picklist', 'MultiselectPicklist'].includes(field.type)) {
    parts.push('    <valueSet>')
    parts.push(buildTag('restricted', field.restricted !== false ? 'true' : 'false', '        '))
    parts.push('        <valueSetDefinition>')
    parts.push('            <sorted>false</sorted>')
    
    if (field.picklistValues && field.picklistValues.length > 0) {
      field.picklistValues.forEach(pv => {
        parts.push('            <value>')
        parts.push(buildTag('fullName', pv.fullName, '                '))
        parts.push(buildTag('default', pv.default === true ? 'true' : 'false', '                '))
        parts.push(buildTag('label', pv.label || pv.fullName, '                '))
        parts.push('            </value>')
      })
    }
    
    parts.push('        </valueSetDefinition>')
    parts.push('    </valueSet>')
  }
  
  // visibleLines (for MultiselectPicklist)
  if (field.type === 'MultiselectPicklist' && field.visibleLines) {
    parts.push(buildTag('visibleLines', field.visibleLines))
  }
  
  // writeRequiresMasterRead (for MasterDetail only)
  if (field.type === 'MasterDetail') {
    parts.push(buildTag('writeRequiresMasterRead', field.writeRequiresMasterRead !== undefined ? field.writeRequiresMasterRead : 'false'))
  }
  
  parts.push('</CustomField>')
  
  return parts.filter(p => p !== '').join('\n')
}
