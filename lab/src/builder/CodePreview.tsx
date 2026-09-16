import { useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { buildPlaybookExportZip } from './playbookExportBundle';

interface Props {
  code: string;
  playbookName: string;
}

export default function CodePreview({ code, playbookName }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownload = () => {
    const base = playbookName.toLowerCase() || 'custom';
    const playbookFileName = `${base}Playbook.ts`;
    const zipName = `${base}-playbook-export.zip`;
    const blob = buildPlaybookExportZip({ playbookFileName, generatedCode: code });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', zipName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        width: '100%',
        background: '#1e1e1e', // Rich dark slate IDE theme
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #2d2d2d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#181818',
        }}
      >
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>Generated Code</div>
          <div style={{ fontSize: '11px', color: '#888888', marginTop: '2px' }}>
            {playbookName.toLowerCase() || 'custom'}Playbook.ts
            <span style={{ opacity: 0.7 }}> · Download = zip + play.ts + playbook.ts</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#059669' : '#333333',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
          >
            {copied ? 'Copied! ✓' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            Download zip
          </button>
        </div>
      </div>

      {/* Monaco Code Viewer */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Editor
          height="100%"
          language="typescript"
          theme="vs-dark"
          value={code}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 12,
            fontFamily: 'monospace',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            lineNumbers: 'on',
            domReadOnly: true,
          }}
        />
      </div>
    </div>
  );
}
