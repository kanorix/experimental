import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TreeNodeProps {
  id: number;
  name: string;
  children?: any[];
  depth?: number;
  renderChildren?: (children: any[]) => React.ReactNode;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  id,
  name,
  children = [],
  depth = 0,
  renderChildren
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className="tree-node"
      >
        <span className="node-icon">{children.length > 0 ? '📁' : '📄'}</span>
        <span className="node-name">{name}</span>
        <span className="node-id">#{id}</span>
      </div>
      {children.length > 0 && renderChildren && (
        <div className="tree-children">
          {renderChildren(children)}
        </div>
      )}
    </div>
  );
};
