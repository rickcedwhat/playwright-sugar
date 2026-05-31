import type { Node, Edge } from '@xyflow/react';

export type NodeData = {
  label: string;
  name: string;
  code?: string;
  timeout?: number;
  skipCode?: string;
  candidates?: Array<{ name: string; isSuccess: boolean; selector: string }>;
  outcomes?: Array<{ name: string; type: 'success' | 'failure' | 'timeout'; selector: string }>;
  kind?: 'prep' | 'act';
  parentId?: string;
  childId?: string;
  offsetX?: number;
  offsetY?: number;
};

/**
 * Sorts nodes in topological/sequential execution order by traversing the graph
 * starting from nodes that have no incoming edges.
 */
export function getSequentialNodes(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  const sorted: Node<NodeData>[] = [];
  const visited = new Set<string>();

  // Map of node ID -> list of outgoing edge target IDs
  const adjList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  nodes.forEach(n => {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    // Only connect if both source and target exist
    if (adjList.has(e.source) && adjList.has(e.target)) {
      adjList.get(e.source)!.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  // Start with nodes that have 0 in-degree
  const queue: string[] = nodes
    .filter(n => (inDegree.get(n.id) || 0) === 0)
    .map(n => n.id);

  // If there's a loop or no 0 in-degree node, just fallback to first node
  if (queue.length === 0 && nodes.length > 0) {
    queue.push(nodes[0].id);
  }

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const node = nodes.find(n => n.id === currId);
    if (node) sorted.push(node);

    const neighbors = adjList.get(currId) || [];
    neighbors.forEach(neighId => {
      inDegree.set(neighId, inDegree.get(neighId)! - 1);
      if (inDegree.get(neighId) === 0) {
        queue.push(neighId);
      }
    });
  }

  // Append any remaining isolated nodes
  nodes.forEach(n => {
    if (!visited.has(n.id)) {
      sorted.push(n);
    }
  });

  return sorted;
}

/**
 * Automatically calculates the skip conditions for each node based on the edges.
 * If an edge originates from a specific detect candidate handle (e.g. sourceHandle = "candidate-notFound"),
 * we skip this node if the resolved outcome of that detect step is NOT that candidate.
 */
export function getAutoSkipPredicate(
  node: Node<NodeData>,
  nodes: Node<NodeData>[],
  edges: Edge[]
): string | null {
  const incomingEdges = edges.filter(e => e.target === node.id);
  if (incomingEdges.length === 0) return null;

  const skipConditions: string[] = [];

  incomingEdges.forEach(e => {
    if (e.source.startsWith('outcome-')) {
      const parts = e.source.split('-');
      const parentId = parts[1];
      const candidateName = parts.slice(2).join('-');
      const parentNode = nodes.find(n => n.id === parentId);
      if (parentNode) {
        const detectStepName = parentNode.data.name;
        if (detectStepName) {
          skipConditions.push(`history.steps.${detectStepName}?.name !== '${candidateName}'`);
        } else {
          skipConditions.push(`history.lastOutcome?.name !== '${candidateName}'`);
        }
      }
    } else if (e.sourceHandle && e.sourceHandle.startsWith('candidate-')) {
      const candidateName = e.sourceHandle.replace('candidate-', '');
      const sourceNode = nodes.find(n => n.id === e.source);
      if (sourceNode) {
        // If the source detect node has a custom step name, reference that step in history.
        // Otherwise, reference history.lastOutcome.
        const detectStepName = sourceNode.data.name;
        if (detectStepName) {
          skipConditions.push(`history.steps.${detectStepName}?.name !== '${candidateName}'`);
        } else {
          skipConditions.push(`history.lastOutcome?.name !== '${candidateName}'`);
        }
      }
    }
  });

  if (skipConditions.length > 0) {
    // Join multiple conditions with AND
    return `(_ctx, history) => ${skipConditions.join(' && ')}`;
  }

  return null;
}

/**
 * Compiles a visual node and edge graph into clean TypeScript code.
 */
export function compilePlaybook(
  playbookName: string,
  playName: string,
  nodes: Node<NodeData>[],
  edges: Edge[]
): string {
  const sequential = getSequentialNodes(nodes, edges);
  let code = `import { Play, Playbook, Outcomes } from '@rickcedwhat/playwright-sugar';\n`;
  code += `import type { Page, Locator } from '@playwright/test';\n\n`;
  code += `export const ${playbookName.toLowerCase()}Pb = new Playbook('${playbookName}', {\n`;
  code += `  ${playName}: () =>\n`;
  code += `    new Play()\n`;

  const indent = '      ';

  sequential.forEach((node) => {
    const autoSkip = getAutoSkipPredicate(node, nodes, edges);
    const skipText = node.data.skipCode
      ? node.data.skipCode
      : autoSkip
      ? autoSkip
      : null;

    const optionsStr = [
      node.data.timeout !== undefined ? `timeout: ${node.data.timeout}` : null,
      skipText ? `skip: ${skipText}` : null,
    ]
      .filter(Boolean)
      .join(', ');

    const optionsArg = optionsStr ? `, { ${optionsStr} }` : '';

    switch (node.type) {
      case 'nav': {
        const actionCode = node.data.code ? node.data.code.trim().replace(/\n/g, '\n' + indent + '  ') : '// Navigation action';
        code += `${indent}.nav('${node.data.name}', async (page, _ctx, { lastOutcome, steps }) => {\n`;
        code += `${indent}  ${actionCode}\n`;
        code += `${indent}}${optionsArg})\n`;
        break;
      }

      case 'detect': {
        const nameArg = node.data.name ? `'${node.data.name}', ` : '';
        code += `${indent}.detect(${nameArg}(page) => [\n`;
        if (node.data.candidates && node.data.candidates.length > 0) {
          node.data.candidates.forEach(c => {
            const locStr = c.selector.startsWith('page.') || c.selector.startsWith('p.') 
              ? c.selector 
              : `page.locator('${c.selector.replace(/'/g, "\\'")}')`;
            code += `${indent}  {\n`;
            code += `${indent}    name: '${c.name}',\n`;
            code += `${indent}    isSuccess: ${c.isSuccess},\n`;
            code += `${indent}    locator: ${locStr},\n`;
            code += `${indent}  },\n`;
          });
        } else {
          code += `${indent}  // Define candidates here\n`;
        }
        code += `${indent}]${optionsArg})\n`;
        break;
      }

      case 'attempt': {
        const actionCode = node.data.code ? node.data.code.trim().replace(/\n/g, '\n' + indent + '  ') : '// Attempt action';
        code += `${indent}.attempt(\n`;
        code += `${indent}  '${node.data.name}',\n`;
        code += `${indent}  async (page, _ctx, { lastOutcome, steps }) => {\n`;
        code += `${indent}    ${actionCode}\n`;
        code += `${indent}  },\n`;
        code += `${indent}  [\n`;
        if (node.data.outcomes && node.data.outcomes.length > 0) {
          node.data.outcomes.forEach(o => {
            const selectorStr = o.selector.startsWith('p.') || o.selector.startsWith('page.')
              ? o.selector
              : `p.locator('${o.selector.replace(/'/g, "\\'")}')`;

            if (o.type === 'success') {
              code += `${indent}    Outcomes.success('${o.name}', (p) => ${selectorStr}),\n`;
            } else if (o.type === 'failure') {
              code += `${indent}    Outcomes.failure('${o.name}', (p) => ${selectorStr}),\n`;
            } else {
              code += `${indent}    Outcomes.timeout(),\n`;
            }
          });
        } else {
          code += `${indent}    Outcomes.timeout(),\n`;
        }
        code += `${indent}  ]${optionsArg}\n`;
        code += `${indent})\n`;
        break;
      }

      case 'prep': {
        const kind = node.data.kind || 'prep';
        const actionCode = node.data.code ? node.data.code.trim().replace(/\n/g, '\n' + indent + '  ') : '// Action code';
        code += `${indent}.${kind}('${node.data.name}', async (page, _ctx, { lastOutcome, steps }) => {\n`;
        code += `${indent}  ${actionCode}\n`;
        code += `${indent}}${optionsArg})\n`;
        break;
      }

      case 'cleanup': {
        const actionCode = node.data.code ? node.data.code.trim().replace(/\n/g, '\n' + indent + '  ') : '// Revert logic';
        code += `${indent}.cleanup('${node.data.name}', async (page, _ctx, { lastOutcome, steps }) => {\n`;
        code += `${indent}  ${actionCode}\n`;
        code += `${indent}}${optionsArg})\n`;
        break;
      }
    }
  });

  // Trim trailing newline and dot
  if (code.endsWith('\n')) {
    code = code.slice(0, -1);
  }

  code += `,\n});\n`;
  return code;
}
