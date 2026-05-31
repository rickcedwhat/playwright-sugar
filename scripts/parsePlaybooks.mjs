import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const playbooksDir = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve(__dirname, '../test-replacement-poc/PoC/src/playbooks');

if (!fs.existsSync(playbooksDir)) {
  throw new Error(`Playbooks directory not found: ${playbooksDir}`);
}

const files = fs.readdirSync(playbooksDir).filter(f => f.endsWith('.ts') && f !== 'toast.ts');

const result = [];

function parseChain(playCode) {
  // Find all method calls: .nav, .detect, .attempt, .prep, .act, .cleanup
  // We can find them by looking for e.g. \.(nav|detect|attempt|prep|act|cleanup)\s*\(
  // We'll iterate through the string and find the boundaries of each method call by matching braces.
  const steps = [];
  let index = 0;
  
  const methodRegex = /\.(nav|detect|attempt|prep|act|cleanup)\s*\(/g;
  let match;
  
  const matches = [];
  while ((match = methodRegex.exec(playCode)) !== null) {
    matches.push({
      type: match[1],
      start: match.index,
      argsStart: match.index + match[0].length
    });
  }
  
  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const nextStart = i < matches.length - 1 ? matches[i + 1].start : playCode.length;
    
    // Extract the content inside the parentheses of this method call
    let depth = 1;
    let pos = curr.argsStart;
    while (pos < playCode.length && depth > 0) {
      if (playCode[pos] === '(') depth++;
      else if (playCode[pos] === ')') depth--;
      pos++;
    }
    const argsContent = playCode.substring(curr.argsStart, pos - 1);
    steps.push({
      type: curr.type,
      argsContent
    });
  }
  
  return steps;
}

function parseArgs(step) {
  const { type, argsContent } = step;
  const data = {
    label: '',
    name: '',
    code: '',
  };
  
  if (type === 'nav') {
    data.label = 'Navigation';
    // Args can be: ('name', fn, opts) or (fn, opts)
    const parts = splitArgs(argsContent);
    if (parts.length > 0) {
      if (parts[0].startsWith("'") || parts[0].startsWith('"')) {
        data.name = parts[0].slice(1, -1);
        data.code = extractCallbackBody(parts[1] || '');
      } else {
        data.name = 'navigate';
        data.code = extractCallbackBody(parts[0]);
      }
    }
  } else if (type === 'detect') {
    data.label = 'State Detection';
    // Args can be: (fn, opts) or ('name', fn, opts)
    const parts = splitArgs(argsContent);
    let fnStr = '';
    let nameVal = '';
    let optsStr = '';
    
    if (parts.length > 0) {
      if (parts[0].startsWith("'") || parts[0].startsWith('"')) {
        nameVal = parts[0].slice(1, -1);
        fnStr = parts[1] || '';
        optsStr = parts[2] || '';
      } else {
        nameVal = '';
        fnStr = parts[0];
        optsStr = parts[1] || '';
      }
    }
    
    data.name = nameVal;
    data.candidates = parseCandidates(fnStr);
    
    // Parse timeout from opts if any
    if (optsStr) {
      const match = /timeout:\s*([0-9_]+)/.exec(optsStr);
      if (match) {
        data.timeout = parseInt(match[1].replace(/_/g, ''));
      }
    }
  } else if (type === 'attempt') {
    data.label = 'Action Attempt';
    // Args: ('name', actionFn, outcomesArray, opts)
    const parts = splitArgs(argsContent);
    if (parts.length >= 3) {
      data.name = parts[0].slice(1, -1);
      data.code = extractCallbackBody(parts[1]);
      data.outcomes = parseOutcomes(parts[2]);
      
      const optsStr = parts[3] || '';
      if (optsStr) {
        const match = /timeout:\s*([0-9_]+)/.exec(optsStr);
        if (match) {
          data.timeout = parseInt(match[1].replace(/_/g, ''));
        }
      }
    }
  } else if (type === 'prep' || type === 'act') {
    data.label = 'Prep / Act';
    data.kind = type === 'act' ? 'act' : 'prep';
    const parts = splitArgs(argsContent);
    if (parts.length > 0) {
      if (parts[0].startsWith("'") || parts[0].startsWith('"')) {
        data.name = parts[0].slice(1, -1);
        data.code = extractCallbackBody(parts[1] || '');
      } else {
        data.name = 'prepare';
        data.code = extractCallbackBody(parts[0]);
      }
    }
  } else if (type === 'cleanup') {
    data.label = 'Cleanup / Revert';
    const parts = splitArgs(argsContent);
    if (parts.length > 0) {
      if (parts[0].startsWith("'") || parts[0].startsWith('"')) {
        data.name = parts[0].slice(1, -1);
        data.code = extractCallbackBody(parts[1] || '');
      } else {
        data.name = 'cleanup';
        data.code = extractCallbackBody(parts[0]);
      }
    }
  }
  
  return data;
}

// Split top-level arguments by comma, ignoring nested parentheses/brackets
function splitArgs(str) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      if (char === stringChar) {
        let backslashCount = 0;
        let j = i - 1;
        while (j >= 0 && str[j] === '\\') { backslashCount++; j--; }
        if (backslashCount % 2 === 0) inString = false;
      }
      continue;
    }
    
    if (char === "'" || char === '"' || char === '`') {
      inString = true;
      stringChar = char;
      continue;
    }
    
    if (char === '(' || char === '[' || char === '{') depth++;
    else if (char === ')' || char === ']' || char === '}') depth--;
    
    if (char === ',' && depth === 0) {
      parts.push(str.substring(start, i).trim());
      start = i + 1;
    }
  }
  
  parts.push(str.substring(start).trim());
  return parts.filter(Boolean);
}

function extractCallbackBody(fnStr) {
  // e.g. async (page) => { ... } or async page => page.click()
  const arrowIdx = fnStr.indexOf('=>');
  if (arrowIdx === -1) return fnStr.trim();
  
  let body = fnStr.substring(arrowIdx + 2).trim();
  if (body.startsWith('{') && body.endsWith('}')) {
    // strip braces and get inner lines
    body = body.substring(1, body.length - 1).trim();
    // remove indent
    const lines = body.split('\n');
    const nonBlank = lines.filter(l => l.trim());
    if (nonBlank.length > 0) {
      const minIndent = Math.min(...nonBlank.map(l => l.match(/^\s*/)[0].length));
      body = lines.map(l => l.substring(minIndent)).join('\n');
    } else {
      body = '';
    }
  }
  return body;
}

function parseCandidates(fnStr) {
  // e.g. (page) => [ { name: '...', locator: ... }, ... ]
  const arrowIdx = fnStr.indexOf('=>');
  if (arrowIdx === -1) return [];
  const body = fnStr.substring(arrowIdx + 2).trim();
  
  // Find array [ ... ]
  const startArr = body.indexOf('[');
  const endArr = body.lastIndexOf(']');
  if (startArr === -1 || endArr === -1) return [];
  
  const arrayContent = body.substring(startArr + 1, endArr).trim();
  // Split objects inside the array
  const objects = splitArgs(arrayContent); // splitArgs will split elements by comma at depth 0
  const candidates = [];
  
  objects.forEach(objStr => {
    // Parse object properties: name, isSuccess, locator
    const nameMatch = /name:\s*['"`]([^'"`]+)['"`]/.exec(objStr);
    const successMatch = /isSuccess:\s*(true|false)/.exec(objStr);
    
    // Extract selector content
    let locatorStr = '';
    const locIdx = objStr.indexOf('locator:');
    if (locIdx !== -1) {
      let locPart = objStr.substring(locIdx + 8).trim();
      if (locPart.endsWith(',')) locPart = locPart.slice(0, -1).trim();
      locatorStr = locPart;
    }
    
    if (nameMatch) {
      candidates.push({
        name: nameMatch[1],
        isSuccess: successMatch ? successMatch[1] === 'true' : true,
        selector: locatorStr || 'page.locator("")'
      });
    }
  });
  
  return candidates;
}

function parseOutcomes(outcomesStr) {
  // e.g. [ Outcomes.success('...', ...), ... ]
  const startArr = outcomesStr.indexOf('[');
  const endArr = outcomesStr.lastIndexOf(']');
  if (startArr === -1 || endArr === -1) return [];
  
  const arrayContent = outcomesStr.substring(startArr + 1, endArr).trim();
  const elements = splitArgs(arrayContent);
  const outcomes = [];
  
  elements.forEach(el => {
    // Matches e.g. Outcomes.success('name', ...) or Outcomes.success(p => ...)
    const successMatch = /Outcomes\.success\((.*)\)/s.exec(el);
    const failureMatch = /Outcomes\.failure\((.*)\)/s.exec(el);
    const timeoutMatch = /Outcomes\.timeout\((.*)\)/s.exec(el);
    
    if (successMatch) {
      const args = splitArgs(successMatch[1]);
      if (args.length >= 2) {
        outcomes.push({
          name: args[0].slice(1, -1),
          type: 'success',
          selector: cleanSelectorLambda(args[1])
        });
      } else {
        outcomes.push({
          name: 'success',
          type: 'success',
          selector: cleanSelectorLambda(args[0])
        });
      }
    } else if (failureMatch) {
      const args = splitArgs(failureMatch[1]);
      if (args.length >= 2) {
        outcomes.push({
          name: args[0].slice(1, -1),
          type: 'failure',
          selector: cleanSelectorLambda(args[1])
        });
      } else {
        outcomes.push({
          name: 'failure',
          type: 'failure',
          selector: cleanSelectorLambda(args[0])
        });
      }
    } else if (timeoutMatch) {
      const args = splitArgs(timeoutMatch[1]);
      let name = 'timeout';
      let selector = '';
      let type = 'timeout';

      if (args.length > 0) {
        const firstIsString = args[0].startsWith("'") || args[0].startsWith('"') || args[0].startsWith('`');
        if (firstIsString) {
          name = args[0].slice(1, -1);
          if (args[1]) selector = cleanSelectorLambda(args[1]);
          const optsArg = args[2] || '';
          if (/isSuccess\s*:\s*true/.test(optsArg)) type = 'success';
        } else {
          // No name arg — first arg could be locator lambda or opts
          const optsArg = args[args.length - 1] || '';
          if (/isSuccess\s*:\s*true/.test(optsArg)) type = 'success';
          if (args[0] && !args[0].includes('isSuccess')) selector = cleanSelectorLambda(args[0]);
        }
      }

      outcomes.push({ name, type, selector });
    }
  });
  
  return outcomes;
}

function cleanSelectorLambda(lambdaStr) {
  // e.g. (p) => p.locator('...') or p => p.locator('...')
  const idx = lambdaStr.indexOf('=>');
  if (idx !== -1) {
    return lambdaStr.substring(idx + 2).trim();
  }
  return lambdaStr;
}

for (const file of files) {
  const content = fs.readFileSync(path.join(playbooksDir, file), 'utf8');
  
  // Find all playbooks in the file
  const playbookRegex = /new\s+Playbook\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\{/g;
  let match;
  
  while ((match = playbookRegex.exec(content)) !== null) {
    const playbookName = match[1];
    const startIdx = match.index + match[0].length;
    
    // Find matching brace of the playbook plays object
    let depth = 1;
    let pos = startIdx;
    while (pos < content.length && depth > 0) {
      if (content[pos] === '{') depth++;
      else if (content[pos] === '}') depth--;
      pos++;
    }
    const playsContent = content.substring(startIdx, pos - 1);
    
    // Parse plays under this playbook
    const plays = [];
    const playNames = [];
    
    // We search for play properties e.g. "  create: ({ name }) =>" at the top level (indented by exactly 2 spaces)
    const playRegex = /(?:^|\n)  (\w+)\s*:\s*\(([^)]*)\)\s*=>/g;
    let playMatch;
    
    const playMatches = [];
    while ((playMatch = playRegex.exec(playsContent)) !== null) {
      if (playMatch[1] !== 'skip' && playMatch[1] !== 'locator' && playMatch[1] !== 'onOutcome') {
        playMatches.push({
          name: playMatch[1],
          start: playMatch.index,
          bodyStart: playMatch.index + playMatch[0].length
        });
      }
    }
    
    for (let i = 0; i < playMatches.length; i++) {
      const curr = playMatches[i];
      const nextStart = i < playMatches.length - 1 ? playMatches[i + 1].start : playsContent.length;
      
      const playCode = playsContent.substring(curr.bodyStart, nextStart).trim();
      
      // Parse step chain from playCode
      const rawSteps = parseChain(playCode);
      const nodes = [];
      const edges = [];
      
      let prevNodeId = null;
      let prevNodeType = null;
      let prevCandidates = [];
      let prevOutcomes = [];
      let currentY = 0;
      
      rawSteps.forEach((s, idx) => {
        const mappedType = s.type === 'act' ? 'prep' : s.type;
        const nodeId = `${mappedType}_${idx + 1}`;
        const nodeData = parseArgs(s);
        
        // 1. Create the step node
        nodes.push({
          id: nodeId,
          type: mappedType,
          position: { x: 250, y: currentY },
          data: nodeData
        });
        
        // 2. Connect from previous node/outcomes to the current node
        if (prevNodeId) {
          if (prevNodeType === 'detect' && prevCandidates.length > 0) {
            // Find which candidates connect to this node
            const skipText = nodeData.skipCode || null;
            const neqMatch = skipText ? /!==\s*['"`]([^'"`]+)['"`]/.exec(skipText) : null;
            const eqMatch = skipText ? /===\s*['"`]([^'"`]+)['"`]/.exec(skipText) : null;
            
            let connectingNames = [];
            if (neqMatch) {
              connectingNames.push(neqMatch[1]);
            } else if (eqMatch) {
              const skipCandidate = eqMatch[1];
              prevCandidates.forEach(c => {
                if (c.name !== skipCandidate) {
                  connectingNames.push(c.name);
                }
              });
            } else {
              // Default to the first success candidate
              const successCand = prevCandidates.find(c => c.isSuccess);
              if (successCand) {
                connectingNames.push(successCand.name);
              } else {
                connectingNames.push(prevCandidates[0].name);
              }
            }
            
            // Connect edges from those outcome nodes to the current node
            connectingNames.forEach(name => {
              const outcomeNodeId = `outcome-${prevNodeId}-${name}`;
              edges.push({
                id: `e-${outcomeNodeId}-${nodeId}`,
                source: outcomeNodeId,
                target: nodeId,
                animated: true,
                style: { strokeWidth: 2 }
              });
            });
          } else if (prevNodeType === 'attempt' && prevOutcomes.length > 0) {
            // Attempt node: connect from the success outcome node to the next step
            const successOutcome = prevOutcomes.find(o => o.type === 'success') || prevOutcomes[0];
            if (successOutcome) {
              const outcomeNodeId = `outcome-${prevNodeId}-${successOutcome.name}`;
              edges.push({
                id: `e-${outcomeNodeId}-${nodeId}`,
                source: outcomeNodeId,
                target: nodeId,
                animated: true,
                style: { strokeWidth: 2 }
              });
            }
          } else {
            // Connect directly from simple previous node to current node
            edges.push({
              id: `e-${prevNodeId}-${nodeId}`,
              source: prevNodeId,
              target: nodeId,
              animated: true,
              style: { strokeWidth: 2 }
            });
          }
        }
        
        // 3. Create outcome nodes for the current node if it has them
        const candidates = nodeData.candidates || [];
        const outcomes = nodeData.outcomes || [];
        
        if (mappedType === 'detect' && candidates.length > 0) {
          const spacing = 220;
          candidates.forEach((c, cIdx) => {
            const outcomeNodeId = `outcome-${nodeId}-${c.name}`;
            const outX = 250 + (cIdx - (candidates.length - 1) / 2) * spacing;
            
            nodes.push({
              id: outcomeNodeId,
              type: 'outcome',
              position: { x: outX, y: currentY + 140 },
              data: {
                name: c.name,
                isSuccess: c.isSuccess,
                selector: c.selector || '',
                isTimeout: (c.name === 'timeout' || (c.name === 'noAccess' && (!c.selector || c.selector === 'page.locator("")' || c.selector === 'p.locator("")'))),
                timeoutMs: nodeData.timeout || 15000
              }
            });
            
            // All edges get a label — no need for a separate labelNode
            edges.push({
              id: `e-${nodeId}-${outcomeNodeId}`,
              source: nodeId,
              target: outcomeNodeId,
              animated: true,
              style: { strokeWidth: 2 },
              data: {
                label: c.name,
                labelOffsetX: 0,
                labelOffsetY: 0
              }
            });
          });
          currentY += 280;
        } else if (mappedType === 'attempt' && outcomes.length > 0) {
          const spacing = 220;
          outcomes.forEach((o, oIdx) => {
            const outcomeNodeId = `outcome-${nodeId}-${o.name}`;
            const outX = 250 + (oIdx - (outcomes.length - 1) / 2) * spacing;
            
            nodes.push({
              id: outcomeNodeId,
              type: 'outcome',
              position: { x: outX, y: currentY + 140 },
              data: {
                name: o.name,
                isSuccess: o.type === 'success',
                selector: o.selector || '',
                isTimeout: (o.type === 'timeout' || o.name === 'timeout'),
                timeoutMs: nodeData.timeout || 15000
              }
            });
            
            // All edges get a label — no need for a separate labelNode
            edges.push({
              id: `e-${nodeId}-${outcomeNodeId}`,
              source: nodeId,
              target: outcomeNodeId,
              animated: true,
              style: { strokeWidth: 2 },
              data: {
                label: o.name,
                labelOffsetX: 0,
                labelOffsetY: 0
              }
            });
          });
          currentY += 280;
        } else {
          currentY += 180;
        }
        
        prevNodeId = nodeId;
        prevNodeType = mappedType;
        prevCandidates = candidates;
        prevOutcomes = outcomes;
      });
      
      plays.push({
        playName: curr.name,
        nodes,
        edges
      });
    }
    
    result.push({
      id: playbookName.toLowerCase() + '-pb',
      playbookName,
      plays
    });
  }
}

// Write the compiled visual playbooks list to a JSON file
const outputPath = path.resolve(__dirname, '../lab/src/builder/preloadedPlaybooks.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
console.log(`Successfully compiled ${result.length} playbooks into ${outputPath}`);
