import React, { useEffect, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TreeNode } from './TreeNode';
import { adjacencyAPI, TreeNode as TreeNodeType } from '../api/client';

export const AdjacencyTree: React.FC = () => {
  const [tree, setTree] = useState<TreeNodeType[]>([]);
  const [debugData, setDebugData] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = async () => {
    const [treeData, debug] = await Promise.all([
      adjacencyAPI.getTree(),
      adjacencyAPI.getDebug(),
    ]);
    setTree(treeData);
    setDebugData(debug);
  };

  useEffect(() => {
    loadData();
  }, []);

  const flattenTree = (nodes: TreeNodeType[]): TreeNodeType[] => {
    return nodes.flatMap((node) => [
      node,
      ...(node.children ? flattenTree(node.children) : []),
    ]);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const flatNodes = flattenTree(tree);
    const oldIndex = flatNodes.findIndex((node) => node.id === active.id);
    const newIndex = flatNodes.findIndex((node) => node.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 簡易的な並び替え処理
    const reordered = arrayMove(flatNodes, oldIndex, newIndex);

    // sort_orderを更新
    const updates = reordered.map((node, index) => ({
      id: node.id,
      parent_id: node.parent_id || null,
      sort_order: index,
    }));

    await adjacencyAPI.updateNodeSort(updates);
    await loadData();
  };

  const renderTree = (nodes: TreeNodeType[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <TreeNode
        key={node.id}
        id={node.id}
        name={node.name}
        depth={depth}
        children={node.children}
        renderChildren={(children) => renderTree(children, depth + 1)}
      />
    ));
  };

  const allIds = flattenTree(tree).map((node) => node.id);

  return (
    <div className="tree-container">
      <h2>隣接リスト (Adjacency List)</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
          <div className="tree">{renderTree(tree)}</div>
        </SortableContext>
      </DndContext>

      <div className="debug-section">
        <h3>データベース構造</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>名前</th>
              <th>親ID</th>
              <th>親名</th>
              <th>順序</th>
            </tr>
          </thead>
          <tbody>
            {debugData.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.parent_id || '-'}</td>
                <td>{row.parent_name || '-'}</td>
                <td>{row.sort_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
