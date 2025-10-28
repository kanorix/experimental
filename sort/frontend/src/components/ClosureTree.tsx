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
import { closureAPI, ClosureItem } from '../api/client';

export const ClosureTree: React.FC = () => {
  const [tree, setTree] = useState<ClosureItem[]>([]);
  const [debugData, setDebugData] = useState<any[]>([]);
  const [pathsData, setPathsData] = useState<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadData = async () => {
    const [treeData, debug, paths] = await Promise.all([
      closureAPI.getTree(),
      closureAPI.getDebug(),
      closureAPI.getDebugPaths(),
    ]);
    setTree(treeData);
    setDebugData(debug);
    setPathsData(paths);
  };

  useEffect(() => {
    loadData();
  }, []);

  const flattenTree = (nodes: ClosureItem[]): ClosureItem[] => {
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
      sort_order: index,
    }));

    await closureAPI.updateItemSort(updates);
    await loadData();
  };

  const renderTree = (nodes: ClosureItem[], depth = 0): React.ReactNode => {
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
      <h2>閉包テーブル (Closure Table)</h2>
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
        <h3>Items テーブル</h3>
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

        <h3>Tree Paths テーブル</h3>
        <table>
          <thead>
            <tr>
              <th>祖先ID</th>
              <th>祖先名</th>
              <th>子孫ID</th>
              <th>子孫名</th>
              <th>深さ</th>
            </tr>
          </thead>
          <tbody>
            {pathsData.map((row, idx) => (
              <tr key={idx}>
                <td>{row.ancestor_id}</td>
                <td>{row.ancestor_name}</td>
                <td>{row.descendant_id}</td>
                <td>{row.descendant_name}</td>
                <td>{row.depth}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
