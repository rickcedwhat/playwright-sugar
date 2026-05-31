import React, { useEffect, useState, useRef } from 'react';
import type { Node } from '@xyflow/react';
import { Editor } from '@monaco-editor/react';
// @ts-ignore
import { constrainedEditor } from 'constrained-editor-plugin';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { NodeData } from './compiler';
import { playwrightDts, playwrightSugarDts } from './dtsDefinitions';

interface Props {
  node: Node<NodeData> | null;
  onClose: () => void;
  onUpdateNode: (id: string, updatedData: Partial<NodeData>) => void;
}

const getIndentSize = (nodeType: string | undefined): number => {
  return nodeType === 'attempt' ? 4 : 2;
};

const indentCode = (str: string, indentSize: number = 2) => {
  if (!str) return ' '.repeat(indentSize);
  const prefix = ' '.repeat(indentSize);
  return str.split('\n').map(line => prefix + line).join('\n');
};

const unindentCode = (str: string, indentSize: number = 2) => {
  if (!str) return '';
  const prefix = ' '.repeat(indentSize);
  return str.split('\n').map(line => line.startsWith(prefix) ? line.substring(indentSize) : line).join('\n');
};

function getDetectFullCode(nodeName: string, candidates: any[]): string {
  const cleanName = nodeName || 'step';
  let code = `import { Page } from '@playwright/test';\n\ndeclare const page: Page;\ndeclare const pb: any;\n\n// Visual Playbook Step (Read-Only):\nawait pb.detect('${cleanName}', (page) => [\n`;
  
  if (candidates && candidates.length > 0) {
    candidates.forEach(c => {
      const locStr = c.selector.startsWith('page.') || c.selector.startsWith('p.') 
        ? c.selector 
        : `page.locator('${c.selector.replace(/'/g, "\\'")}')`;
      code += `  {\n    name: '${c.name}',\n    isSuccess: ${c.isSuccess},\n    locator: ${locStr},\n  },\n`;
    });
  } else {
    code += `  // Define candidates here\n`;
  }
  
  code += `]);`;
  return code;
}

function getWrapperTemplate(nodeType: string | undefined, nodeName: string, prepKind: string, outcomes: any[]): { header: string; footer: string } {
  let header = '';
  let footer = '';

  const cleanName = nodeName || 'step';
  const cleanType = nodeType || '';

  switch (cleanType) {
    case 'nav':
      header = `import { Page } from '@playwright/test';\nimport { PlayOutcome } from '@rickcedwhat/playwright-sugar';\n\ndeclare const page: Page;\ndeclare const lastOutcome: PlayOutcome | undefined;\ndeclare const steps: Record<string, PlayOutcome>;\ndeclare const pb: any;\n\n// Visual Playbook Step:\nawait pb.nav('${cleanName}', async (page, _ctx, { lastOutcome, steps }) => {`;
      footer = `\n});`;
      break;
    case 'prep':
      header = `import { Page } from '@playwright/test';\nimport { PlayCtx, PlayOutcome } from '@rickcedwhat/playwright-sugar';\n\ndeclare const page: Page;\ndeclare const _ctx: PlayCtx;\ndeclare const lastOutcome: PlayOutcome | undefined;\ndeclare const steps: Record<string, PlayOutcome>;\ndeclare const pb: any;\n\n// Visual Playbook Step:\nawait pb.${prepKind}('${cleanName}', async (page, _ctx, { lastOutcome, steps }) => {`;
      footer = `\n});`;
      break;
    case 'attempt': {
      let outcomesList = `  [\n`;
      if (outcomes && outcomes.length > 0) {
        outcomes.forEach(o => {
          const selectorStr = o.selector.startsWith('p.') || o.selector.startsWith('page.')
            ? o.selector
            : `p.locator('${o.selector.replace(/'/g, "\\'")}')`;

          if (o.type === 'success') {
            outcomesList += `    Outcomes.success('${o.name}', (p) => ${selectorStr}),\n`;
          } else if (o.type === 'failure') {
            outcomesList += `    Outcomes.failure('${o.name}', (p) => ${selectorStr}),\n`;
          } else {
            outcomesList += `    Outcomes.timeout(),\n`;
          }
        });
      } else {
        outcomesList += `    Outcomes.timeout(),\n`;
      }
      outcomesList += `  ]`;

      header = `import { Page } from '@playwright/test';\nimport { PlayCtx, PlayOutcome, Outcomes } from '@rickcedwhat/playwright-sugar';\n\ndeclare const page: Page;\ndeclare const _ctx: PlayCtx;\ndeclare const lastOutcome: PlayOutcome | undefined;\ndeclare const steps: Record<string, PlayOutcome>;\ndeclare const pb: any;\n\n// Visual Playbook Step:\nawait pb.attempt(\n  '${cleanName}',\n  async (page, _ctx, { lastOutcome, steps }) => {`;
      footer = `\n  },\n${outcomesList}\n);`;
      break;
    }
    case 'cleanup':
      header = `import { Page } from '@playwright/test';\nimport { PlayCtx, PlayOutcome } from '@rickcedwhat/playwright-sugar';\n\ndeclare const page: Page;\ndeclare const _ctx: PlayCtx;\ndeclare const lastOutcome: PlayOutcome | undefined;\ndeclare const steps: Record<string, PlayOutcome>;\ndeclare const pb: any;\n\n// Visual Playbook Step:\nawait pb.cleanup('${cleanName}', async (page, _ctx, { lastOutcome, steps }) => {`;
      footer = `\n});`;
      break;
  }

  return { header, footer };
}

export default function PropertiesPanel({ node, onClose, onUpdateNode }: Props) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [timeout, setTimeoutVal] = useState<number | undefined>(undefined);
  const [skipCode, setSkipCode] = useState('');
  const [candidates, setCandidates] = useState<Array<{ name: string; isSuccess: boolean; selector: string }>>([]);
  const [outcomes, setOutcomes] = useState<Array<{ name: string; type: 'success' | 'failure' | 'timeout'; selector: string }>>([]);
  const [kind, setKind] = useState<'prep' | 'act'>('prep');

  const [configCollapsed, setConfigCollapsed] = useState(true);
  const [listCollapsed, setListCollapsed] = useState(true);

  const editorRef = useRef<any>(null);
  const constrainedRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  const updateDecorations = () => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco || !node) return;

    const model = editor.getModel();
    if (!model) return;

    if (node.type === 'detect') {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
      return;
    }

    const { header, footer } = getWrapperTemplate(node.type, name, kind, outcomes);
    const headerLines = header.split('\n').length;
    const footerLines = footer.split('\n').length;
    const totalLines = model.getLineCount();

    const startLine = headerLines + 1;
    const endLine = Math.max(startLine, totalLines - footerLines);
    const maxCol = model.getLineMaxColumn(endLine);

    const newDecorations = [
      {
        range: new monaco.Range(startLine, 1, endLine, maxCol),
        options: {
          isWholeLine: true,
          className: 'monaco-editable-line',
        },
      },
    ];

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  const applyRestrictions = () => {
    const editor = editorRef.current;
    const constrained = constrainedRef.current;
    if (!editor || !constrained || !node) return;

    const model = editor.getModel();
    if (!model) return;

    if (node.type === 'detect') {
      constrained.addRestrictionsTo(model, []);
      updateDecorations();
      return;
    }

    const { header } = getWrapperTemplate(node.type, name, kind, outcomes);
    const headerLines = header.split('\n').length;
    const userCodeLines = indentCode(code, getIndentSize(node.type)).split('\n').length;

    const startLine = headerLines + 1;
    const startCol = 1;
    const endLine = headerLines + userCodeLines;
    const endCol = model.getLineMaxColumn(endLine);

    try {
      // Clear existing restrictions
      constrained.addRestrictionsTo(model, []);
      // Add new restriction on the editable user code range
      constrained.addRestrictionsTo(model, [
        {
          range: [startLine, startCol, endLine, endCol],
          allowMultiline: true,
        }
      ]);
      // Apply visual highlight decorations
      updateDecorations();
    } catch (err) {
      console.warn('Failed to apply Monaco restrictions: ', err);
    }
  };

  // Synchronize decorations whenever code, name, kind or active node changes
  useEffect(() => {
    updateDecorations();
  }, [code, name, kind, node, outcomes]);

  useEffect(() => {
    if (node) {
      const nodeName = node.data.name || '';
      const nodeCode = node.data.code || '';
      const nodeKind = node.data.kind || 'prep';
      const nodeOutcomes = node.data.outcomes || [];
      const nodeCandidates = node.data.candidates || [];

      setName(nodeName);
      setCode(nodeCode);
      setTimeoutVal(node.data.timeout);
      setSkipCode(node.data.skipCode || '');
      setCandidates(nodeCandidates);
      setOutcomes(nodeOutcomes);
      setKind(nodeKind);
      setConfigCollapsed(true);
      setListCollapsed(true);

      const editor = editorRef.current;
      if (editor) {
        if (node.type === 'detect') {
          editor.setValue(getDetectFullCode(nodeName, nodeCandidates));
          setTimeout(() => {
            applyRestrictions();
          }, 50);
        } else {
          const { header, footer } = getWrapperTemplate(node.type, nodeName, nodeKind, nodeOutcomes);
          editor.setValue(header + '\n' + indentCode(nodeCode, getIndentSize(node.type)) + '\n' + footer);
          setTimeout(() => {
            applyRestrictions();
          }, 50);
        }
      }
    }
  }, [node]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !node) return;

    if (node.type === 'detect') {
      const detectCode = getDetectFullCode(name, candidates);
      if (editor.getValue() !== detectCode) {
        editor.setValue(detectCode);
      }
      return;
    }

    const { header, footer } = getWrapperTemplate(node.type, name, kind, outcomes);
    const correctText = header + '\n' + indentCode(code, getIndentSize(node.type)) + '\n' + footer;

    if (editor.getValue() !== correctText) {
      editor.setValue(correctText);
      setTimeout(() => {
        applyRestrictions();
      }, 50);
    }
  }, [name, kind, outcomes, candidates]);

  if (!node) return null;

  const handleFieldChange = (fields: Partial<NodeData>) => {
    onUpdateNode(node.id, fields);
  };

  const handleMonacoMount = (editor: any, monaco: any) => {
    monacoRef.current = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: 99, // ESNext module kind allows top-level await!
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      noEmit: true,
    });

    // Inject typings
    monaco.languages.typescript.typescriptDefaults.addExtraLib(playwrightDts, 'ts:node_modules/@playwright/test/index.d.ts');
    monaco.languages.typescript.typescriptDefaults.addExtraLib(playwrightSugarDts, 'ts:node_modules/@rickcedwhat/playwright-sugar/index.d.ts');

    // Initialize Constrained Editor Plugin
    const constrainedInstance = constrainedEditor(monaco);
    constrainedInstance.initializeIn(editor);

    editorRef.current = editor;
    constrainedRef.current = constrainedInstance;

    // Set initial value & apply restrictions
    if (node.type === 'detect') {
      editor.setValue(getDetectFullCode(name, candidates));
    } else {
      const { header, footer } = getWrapperTemplate(node.type, name, kind, outcomes);
      editor.setValue(header + '\n' + indentCode(code, getIndentSize(node.type)) + '\n' + footer);
      setTimeout(() => {
        applyRestrictions();
      }, 50);
    }
  };

  const getEditorValue = () => {
    if (node.type === 'detect') {
      return getDetectFullCode(name, candidates);
    }
    const { header, footer } = getWrapperTemplate(node.type, name, kind, outcomes);
    return header + '\n' + indentCode(code, getIndentSize(node.type)) + '\n' + footer;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!value || node.type === 'detect') return;

    const { header, footer } = getWrapperTemplate(node.type, name, kind, outcomes);

    if (value.startsWith(header) && value.endsWith(footer)) {
      const startIdx = header.length + 1; // skip header + newline
      const endIdx = value.length - footer.length - 1; // skip footer + newline
      
      const extracted = value.substring(startIdx, endIdx);
      const unindented = unindentCode(extracted, getIndentSize(node.type));

      setCode(unindented);
      handleFieldChange({ code: unindented });
    } else {
      // Revert editor to the valid state if wrapping templates were violated
      const correctText = header + '\n' + indentCode(code, getIndentSize(node.type)) + '\n' + footer;
      if (editorRef.current && editorRef.current.getValue() !== correctText) {
        editorRef.current.setValue(correctText);
        applyRestrictions();
      }
    }
  };

  // Candidates Helpers (for Detect Nodes)
  const addCandidate = () => {
    const next = [...candidates, { name: 'state_' + (candidates.length + 1), isSuccess: true, selector: '' }];
    setCandidates(next);
    handleFieldChange({ candidates: next });
    setListCollapsed(false);
  };

  const updateCandidate = (index: number, fields: any) => {
    const next = candidates.map((c, i) => (i === index ? { ...c, ...fields } : c));
    setCandidates(next);
    handleFieldChange({ candidates: next });
  };

  const removeCandidate = (index: number) => {
    const next = candidates.filter((_, i) => i !== index);
    setCandidates(next);
    handleFieldChange({ candidates: next });
  };

  // Outcomes Helpers (for Attempt Nodes)
  const addOutcome = () => {
    const next = [...outcomes, { name: 'outcome_' + (outcomes.length + 1), type: 'success' as const, selector: '' }];
    setOutcomes(next);
    handleFieldChange({ outcomes: next });
    setListCollapsed(false);
  };

  const updateOutcome = (index: number, fields: any) => {
    const next = outcomes.map((o, i) => (i === index ? { ...o, ...fields } : o));
    setOutcomes(next);
    handleFieldChange({ outcomes: next });
  };

  const removeOutcome = (index: number) => {
    const next = outcomes.filter((_, i) => i !== index);
    setOutcomes(next);
    handleFieldChange({ outcomes: next });
  };

  return (
    <div
      style={{
        width: '100%',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.05)',
        zIndex: 5,
        fontFamily: 'inherit',
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>Configure Step</div>
          <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '2px' }}>
            ID: {node.id}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'none', fontSize: '18px', color: '#9ca3af', cursor: 'pointer' }}
        >
          ✕
        </button>
      </div>

      {/* Content Form */}
      <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflow: 'hidden' }}>
        
        {/* Scrollable Form Blocks (Shrinks to fit, scrolls internally if needed) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flexShrink: 0, maxHeight: '60%' }}>
          
          {/* Collapsible Section: Basic Configuration */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
            <button
              onClick={() => setConfigCollapsed(!configCollapsed)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: '#f9fafb',
                border: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '12px',
                color: '#4b5563',
                borderBottom: configCollapsed ? 'none' : '1px solid #e5e7eb',
              }}
            >
              <span>Basic Configuration</span>
              {configCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            {!configCollapsed && (
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Step Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Step Name / Label</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      handleFieldChange({ name: e.target.value });
                    }}
                    style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                  />
                </div>

                {/* Prep Node Kind Selection */}
                {node.type === 'prep' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Step Kind</label>
                    <select
                      value={kind}
                      onChange={(e) => {
                        const k = e.target.value as 'prep' | 'act';
                        setKind(k);
                        handleFieldChange({ kind: k });
                      }}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    >
                      <option value="prep">Preparation (.prep)</option>
                      <option value="act">Standard Action (.act)</option>
                    </select>
                  </div>
                )}

                {/* Step Timeout */}
                {(node.type === 'detect' || node.type === 'attempt') && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Timeout (ms, optional)</label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={timeout || ''}
                      onChange={(e) => {
                        const val = e.target.value ? parseInt(e.target.value) : undefined;
                        setTimeoutVal(val);
                        handleFieldChange({ timeout: val });
                      }}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                )}

                {/* Custom Skip Predicate */}
                {node.type !== 'attempt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Skip Predicate (JS Code, optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. (_ctx, history) => history.lastOutcome?.name !== 'found'"
                      value={skipCode}
                      onChange={(e) => {
                        setSkipCode(e.target.value);
                        handleFieldChange({ skipCode: e.target.value });
                      }}
                      style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Collapsible Section: Candidates / Outcomes */}
          {(node.type === 'detect' || node.type === 'attempt') && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
              <button
                onClick={() => setListCollapsed(!listCollapsed)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: '#f9fafb',
                  border: 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '12px',
                  color: '#4b5563',
                  borderBottom: listCollapsed ? 'none' : '1px solid #e5e7eb',
                }}
              >
                <span>
                  {node.type === 'detect'
                    ? `Detect Candidates (${candidates.length})`
                    : `Expected Outcomes (${outcomes.length})`}
                </span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      node.type === 'detect' ? addCandidate() : addOutcome();
                    }}
                    style={{
                      background: node.type === 'detect' ? '#10b981' : '#3b82f6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    + Add
                  </button>
                  {listCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {!listCollapsed && (
                <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                  {/* Candidates */}
                  {node.type === 'detect' && candidates.map((c, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                      <button
                        onClick={() => removeCandidate(i)}
                        style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Candidate Name"
                          value={c.name}
                          onChange={(e) => updateCandidate(i, { name: e.target.value })}
                          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', outline: 'none' }}
                        />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#374151', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={c.isSuccess}
                            onChange={(e) => updateCandidate(i, { isSuccess: e.target.checked })}
                          />
                          Success
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Selector (e.g. css selector or p.getByRole)"
                        value={c.selector}
                        onChange={(e) => updateCandidate(i, { selector: e.target.value })}
                        style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
                      />
                    </div>
                  ))}

                  {/* Outcomes */}
                  {node.type === 'attempt' && outcomes.map((o, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px', position: 'relative' }}>
                      <button
                        onClick={() => removeOutcome(i)}
                        style={{ position: 'absolute', right: '8px', top: '8px', border: 'none', background: 'none', color: '#9ca3af', fontSize: '12px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          placeholder="Outcome Name"
                          value={o.name}
                          onChange={(e) => updateOutcome(i, { name: e.target.value })}
                          style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', outline: 'none' }}
                        />
                        <select
                          value={o.type}
                          onChange={(e) => updateOutcome(i, { type: e.target.value })}
                          style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px', fontSize: '11px', outline: 'none' }}
                        >
                          <option value="success">Success</option>
                          <option value="failure">Failure</option>
                          <option value="timeout">Timeout</option>
                        </select>
                      </div>
                      {o.type !== 'timeout' && (
                        <input
                          type="text"
                          placeholder="Selector locator (e.g. p.getByText)"
                          value={o.selector}
                          onChange={(e) => updateOutcome(i, { selector: e.target.value })}
                          style={{ border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Monaco Editor Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #f3f4f6', paddingTop: '16px', flex: 1, minHeight: 0 }}>
          <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
            {node.type === 'detect' ? 'Generated Step Code (Read-Only)' : 'Script Action Body'}
          </label>
          <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden' }}>
            <Editor
              height="100%"
              language="typescript"
              theme="vs-dark"
              value={getEditorValue()}
              onMount={handleMonacoMount}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: false },
                fontSize: 12,
                fontFamily: 'monospace',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: node.type === 'detect',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
