# 🚀 Salesforce Field Metadata Generator

A powerful, user-friendly web application for creating and managing Salesforce custom field metadata. Generate field definitions visually, leverage AI for bulk creation, and export production-ready XML files.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## ✨ Features

### 🎨 Visual Field Editor
- **Intuitive Interface**: Create and edit Salesforce fields with a clean, modern UI
- **All Field Types Supported**: Text, Number, Date, Lookup, Formula, Picklist, and more
- **Real-time XML Preview**: See your metadata XML as you build
- **Dark Mode**: Easy on the eyes with full dark mode support

### 🤖 AI-Powered Generation
- **Smart Field Creation**: Upload field specifications and let AI generate JSON
- **Document Support**: Parse .txt, .md, and .docx files
- **Bulk Operations**: Create multiple fields at once from specifications

### 📦 Import/Export
- **JSON Import**: Paste or upload JSON field definitions
- **XML Export**: Download Salesforce-ready metadata XML files
- **Batch Download**: Export all fields or filter by category (General, Lookup, Formula)
- **Individual Export**: Download single field XML files

### 🎯 Field Management
- **Categorization**: Organize fields by type (General, Lookup, Formula)
- **Search & Filter**: Quickly find fields with filtering
- **Duplicate Detection**: Prevent duplicate API names
- **Field History Tracking**: Configure field history tracking

## 🚀 Quick Start

### Prerequisites
- Node.js 16.x or higher
- npm or yarn package manager

### Installation

1. **Clone or extract the project**
```bash
cd salesforce-field-generator
```

2. **Install dependencies**
```bash
npm install
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:3000
```

## 📖 Usage Guide

### Creating a New Field

1. Click the **"+ Add Field"** button in the sidebar
2. Fill in the field properties:
   - **API Name**: Must end with `__c` (e.g., `Patient_Name__c`)
   - **Label**: User-friendly display name
   - **Type**: Select from 17+ field types
   - **Properties**: Configure length, precision, required, etc.
3. Switch to the **XML Preview** tab to see the generated metadata
4. Click **Download** to export the field

### Using AI Generation

1. Click **"📥 Import"** in the sidebar
2. Select the **"✨ AI Generate"** tab
3. Either:
   - **Paste field specifications** directly in the text area
   - **Upload a file** (.txt, .md, .docx) with specifications
4. Click **"✨ Generate JSON"**
5. Review the generated fields and click **"Import Fields"**

#### AI Input Example
```
Patient Information Fields:
- Patient Name (Lookup to Contact, Required)
- Date of Birth (Date field, Required)
- Medical Record Number (Text, 50 characters, External ID, Unique)
- Blood Type (Picklist: A+, A-, B+, B-, O+, O-, AB+, AB-)
- Insurance Active (Checkbox, default: true)
- Last Visit Date (Date)
- Notes (Long Text, 5000 characters)
```

### Importing JSON

1. Click **"📥 Import"** in the sidebar
2. Select the **"💾 Paste JSON"** tab
3. Paste your JSON:
```json
{
  "objectName": "Patient__c",
  "fields": [
    {
      "apiName": "Patient_Name__c",
      "label": "Patient Name",
      "type": "Text",
      "length": 255,
      "required": true
    }
  ]
}
```
4. Click **"Import Fields"**

### Exporting Fields

#### Export All Fields
- Click the **"⬇ Download All"** button in the header

#### Export by Category
- In the sidebar, click the download icon next to field categories:
  - **General Fields**: All standard field types
  - **Lookup/Master-Detail**: Relationship fields
  - **Formula Fields**: Formula and rollup summary fields

#### Export Single Field
- Click the download icon next to any field in the sidebar

## 🏗️ Project Structure

```
salesforce-field-generator/
├── src/
│   ├── App.jsx                    # Main application component
│   ├── main.jsx                   # Application entry point
│   ├── index.css                  # Global styles
│   │
│   ├── components/
│   │   └── ImportModal.jsx        # Import modal with AI generation
│   │
│   └── utils/
│       ├── xmlGenerator.js        # Salesforce XML metadata generator
│       ├── aiGenerator.js         # AI field generation logic
│       └── fileParser.js          # Document parsing (.txt, .md, .docx)
│
├── api/
│   └── generate.js                # Vercel serverless function for AI
│
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── vercel.json                    # Vercel deployment config
└── package.json                   # Dependencies and scripts
```

## 🛠️ Technical Stack

- **Frontend Framework**: React 18.2
- **Build Tool**: Vite 4.4
- **UI Icons**: Lucide React
- **File Processing**: 
  - JSZip (ZIP file generation)
  - Mammoth (DOCX parsing)
- **Deployment**: Vercel (serverless functions)
- **AI Integration**: Google Gemini API

## 📝 Supported Field Types

| Field Type | Metadata Support | Features |
|------------|------------------|----------|
| Text | ✅ | Length (1-255), External ID, Unique |
| TextArea | ✅ | Length (1-255), Visible Lines |
| LongTextArea | ✅ | Length (256-131,072), Visible Lines |
| RichTextArea | ✅ | Length (256-131,072), Visible Lines |
| Number | ✅ | Precision (1-18), Scale (0-17) |
| Currency | ✅ | Precision (1-18), Scale (0-17) |
| Percent | ✅ | Precision (1-18), Scale (0-17) |
| Checkbox | ✅ | Default Value |
| Date | ✅ | Standard date field |
| DateTime | ✅ | Date and time field |
| Email | ✅ | Email validation, External ID, Unique |
| Phone | ✅ | Phone number formatting |
| URL | ✅ | URL validation |
| Picklist | ✅ | Values, Default, Restricted |
| Multi-Select Picklist | ✅ | Values, Default, Visible Lines |
| Lookup | ✅ | Reference To, Relationship Name, Delete Constraint |
| Master-Detail | ✅ | Parent object, Relationship Order, Reparentable |
| Formula | ✅ | Return Type, Formula Expression, Blank Handling |

## ⚙️ Configuration

### Environment Variables

For AI generation to work, you need to configure the Gemini API:

1. Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_api_key_here
```

2. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Vercel Deployment

The project is pre-configured for Vercel deployment:

```bash
npm install -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `GEMINI_API_KEY`: Your Google Gemini API key

## 🎨 Customization

### Changing Theme Colors

Edit `src/App.jsx` to customize colors:

```javascript
const rootStyles = {
  backgroundColor: darkMode ? '#020617' : '#f1f5f9', // Background
  color: darkMode ? '#f1f5f9' : '#0f172a',          // Text
}
```

### Adding Custom Field Types

1. Add to `FIELD_TYPES` array in `src/App.jsx`
2. Update XML generation in `src/utils/xmlGenerator.js`
3. Add UI handling in field editor component

## 🐛 Troubleshooting

### Blank Screen Issues
- **Check Console**: Open browser DevTools (F12) and check for errors
- **Clear Cache**: Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- **Dependencies**: Ensure all npm packages installed: `npm install`

### AI Generation Not Working
- **API Key**: Verify `GEMINI_API_KEY` is set correctly
- **Network**: Check browser console for API errors
- **Input Format**: Ensure field specifications are clear and well-formatted

### XML Export Issues
- **Required Fields**: Ensure required fields (API Name, Label, Type) are filled
- **Validation**: Check that field values match Salesforce limits
- **Special Characters**: Avoid special characters in API names

## 📚 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔒 Security Notes

- Never commit API keys to version control
- Use environment variables for sensitive data
- Validate all user inputs before processing
- Keep dependencies up to date: `npm audit fix`

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review browser console for errors
3. Ensure all dependencies are installed
4. Verify Node.js version compatibility (16.x+)

## 🙏 Acknowledgments

- **Salesforce Metadata API** for field metadata specifications
- **React Team** for the amazing framework
- **Vite** for blazing-fast build tooling
- **Lucide** for beautiful icons
- **Google Gemini** for AI capabilities

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Initial release
- ✅ Support for all major Salesforce field types
- ✅ AI-powered field generation
- ✅ JSON import/export
- ✅ XML metadata export
- ✅ Dark mode support
- ✅ Category-based filtering

---

**Built with ❤️ for Salesforce Developers**

Need help? Have suggestions? Feel free to open an issue or contribute!
