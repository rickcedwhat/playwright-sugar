import React, { useCallback, useEffect, useRef } from 'react';
import { EdgeLabelRenderer, useReactFlow, useStore } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

/**
 * LabeledEdge
 *
 * Draws a single quadratic bezier from source → target.
 * The label is rendered via EdgeLabelRenderer (an HTML overlay outside the SVG)
 * so mouse events work reliably. Dragging it moves the bezier control point,
 * bending the curve — A—B—C where B is a movable point on one continuous path.
 */

interface LabeledEdgeData {
  label?: string;
  cpOffsetX?: number;
  cpOffsetY?: number;
}

export default function LabeledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
  data,
  animated,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  // Current zoom so we can convert screen-px → flow-units on drag
  const zoom = useStore((s) => s.transform[2]);

  const edgeData = (data ?? {}) as LabeledEdgeData;
  const label = edgeData.label;

  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;
  const cpOffsetX = edgeData.cpOffsetX ?? 0;
  const cpOffsetY = edgeData.cpOffsetY ?? 0;
  const cpX = midX + cpOffsetX;
  const cpY = midY + cpOffsetY;

  // Single quadratic bezier
  const pathD = `M ${sourceX} ${sourceY} Q ${cpX} ${cpY} ${targetX} ${targetY}`;

  // Label position in flow-space at t=0.5 on the quadratic bezier:
  // P(0.5) = 0.25*P0 + 0.5*CP + 0.25*P2
  // EdgeLabelRenderer already applies the viewport transform, so we pass flow coords directly.
  const labelX = 0.25 * sourceX + 0.5 * cpX + 0.25 * targetX;
  const labelY = 0.25 * sourceY + 0.5 * cpY + 0.25 * targetY;

  // ── Drag ──────────────────────────────────────────────────────────────────
  const dragging = useRef(false);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, cpOffsetX: 0, cpOffsetY: 0 });
  const dragCleanup = useRef<(() => void) | null>(null);

  // Remove listeners if the edge unmounts mid-drag
  useEffect(() => () => { dragCleanup.current?.(); }, []);

  const onLabelMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragging.current = true;
      dragStart.current = { mouseX: e.clientX, mouseY: e.clientY, cpOffsetX, cpOffsetY };

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        // Convert screen-pixel delta → flow-unit delta
        const dx = (ev.clientX - dragStart.current.mouseX) / zoom;
        const dy = (ev.clientY - dragStart.current.mouseY) / zoom;
        setEdges((eds) =>
          eds.map((ed) =>
            ed.id !== id
              ? ed
              : {
                  ...ed,
                  data: {
                    ...(ed.data ?? {}),
                    cpOffsetX: dragStart.current.cpOffsetX + dx,
                    cpOffsetY: dragStart.current.cpOffsetY + dy,
                  },
                }
          )
        );
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        dragCleanup.current = null;
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      dragCleanup.current = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
    },
    [id, cpOffsetX, cpOffsetY, zoom, setEdges]
  );

  const animClass = animated ? 'react-flow__edge-path animated' : 'react-flow__edge-path';

  return (
    <>
      {/* SVG bezier path */}
      <path id={id} className={animClass} d={pathD} markerEnd={markerEnd} style={style} fill="none" />

      {/* Wider transparent interaction path */}
      <path d={pathD} fill="none" strokeWidth={20} stroke="transparent" className="react-flow__edge-interaction" />

      {/* Label pill rendered in the HTML overlay — events work perfectly here */}
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nopan nodrag"
            onMouseDown={onLabelMouseDown}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              background: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '20px',
              padding: '2px 10px',
              fontSize: '10px',
              fontWeight: 500,
              color: '#4b5563',
              whiteSpace: 'nowrap',
              cursor: 'grab',
              userSelect: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              pointerEvents: 'all',
              lineHeight: '16px',
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
