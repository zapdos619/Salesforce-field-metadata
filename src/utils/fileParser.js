/**
 * File Parser Utility
 * Handles parsing of different file formats (.txt, .md, .docx)
 */

export async function parseFile(file) {
  if (!file) throw new Error('No file provided');

  const fileName = file.name.toLowerCase();
  const fileExtension = fileName.split('.').pop();

  if (!isValidFileType(file)) {
    throw new Error(`Unsupported file type: .${fileExtension}. Please use .txt, .md, or .docx files.`);
  }

  if (!isValidFileSize(file, 10)) {
    throw new Error(`File is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
  }

  try {
    if (fileExtension === 'txt' || fileExtension === 'md') {
      return await parseTextFile(file);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      return await parseDocxFile(file);
    } else {
      throw new Error(`Unsupported file type: .${fileExtension}`);
    }
  } catch (error) {
    throw new Error(`Failed to parse ${getFileTypeName(file)}: ${error.message}`);
  }
}

async function parseTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      if (!text || text.trim().length === 0) {
        reject(new Error('File appears to be empty'));
        return;
      }
      resolve(text);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

async function parseDocxFile(file) {
  return new Promise(async (resolve, reject) => {
    try {
      let mammoth;
      try {
        mammoth = await import('mammoth');
      } catch (importError) {
        reject(new Error('DOCX support is not available. Please use .txt or .md files.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          
          if (!result.value || result.value.trim().length === 0) {
            reject(new Error('No text content found in Word document'));
            return;
          }
          
          if (result.messages && result.messages.length > 0) {
            console.warn('DOCX parsing warnings:', result.messages);
          }
          
          resolve(result.value);
        } catch (mammothError) {
          reject(new Error(`Failed to extract text: ${mammothError.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Word document'));
      reader.readAsArrayBuffer(file);
    } catch (error) {
      reject(error);
    }
  });
}

export function isValidFileType(file) {
  const validExtensions = ['txt', 'md', 'docx', 'doc'];
  const extension = file.name.toLowerCase().split('.').pop();
  return validExtensions.includes(extension);
}

export function getFileTypeName(file) {
  const extension = file.name.toLowerCase().split('.').pop();
  const typeNames = {
    'txt': 'Text File',
    'md': 'Markdown File',
    'docx': 'Word Document',
    'doc': 'Word Document'
  };
  return typeNames[extension] || 'Unknown File';
}

export function isValidFileSize(file, maxSizeMB = 10) {
  return file.size <= maxSizeMB * 1024 * 1024;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
