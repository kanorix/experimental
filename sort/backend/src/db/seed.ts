import db from './client.js';
import { initializeDatabase } from './schema.js';

// データベースをクリアして再作成
const resetDatabase = () => {
  db.exec(`
    DROP TABLE IF EXISTS tree_paths;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS nodes;
  `);
  initializeDatabase();
};

// 隣接リストのテストデータ
const seedAdjacencyList = () => {
  const insert = db.prepare(`
    INSERT INTO nodes (id, name, parent_id, sort_order)
    VALUES (?, ?, ?, ?)
  `);

  const nodes = [
    { id: 1, name: 'Root', parent_id: null, sort_order: 0 },
    { id: 2, name: 'Folder A', parent_id: 1, sort_order: 0 },
    { id: 3, name: 'Folder B', parent_id: 1, sort_order: 1 },
    { id: 4, name: 'File A-1', parent_id: 2, sort_order: 0 },
    { id: 5, name: 'File A-2', parent_id: 2, sort_order: 1 },
    { id: 6, name: 'File B-1', parent_id: 3, sort_order: 0 },
    { id: 7, name: 'Folder A-3', parent_id: 2, sort_order: 2 },
    { id: 8, name: 'File A-3-1', parent_id: 7, sort_order: 0 },
  ];

  const insertMany = db.transaction((nodes) => {
    for (const node of nodes) {
      insert.run(node.id, node.name, node.parent_id, node.sort_order);
    }
  });

  insertMany(nodes);
  console.log('Adjacency list seeded');
};

// 閉包テーブルのテストデータ
const seedClosureTable = () => {
  const insertItem = db.prepare(`
    INSERT INTO items (id, name, sort_order)
    VALUES (?, ?, ?)
  `);

  const insertPath = db.prepare(`
    INSERT INTO tree_paths (ancestor_id, descendant_id, depth)
    VALUES (?, ?, ?)
  `);

  const items = [
    { id: 1, name: 'Root', sort_order: 0 },
    { id: 2, name: 'Folder A', sort_order: 0 },
    { id: 3, name: 'Folder B', sort_order: 1 },
    { id: 4, name: 'File A-1', sort_order: 0 },
    { id: 5, name: 'File A-2', sort_order: 1 },
    { id: 6, name: 'File B-1', sort_order: 0 },
    { id: 7, name: 'Folder A-3', sort_order: 2 },
    { id: 8, name: 'File A-3-1', sort_order: 0 },
  ];

  // ツリー構造: paths (ancestor, descendant, depth)
  const paths = [
    // Root (1)
    [1, 1, 0],
    [1, 2, 1], [1, 3, 1],
    [1, 4, 2], [1, 5, 2], [1, 6, 2], [1, 7, 2],
    [1, 8, 3],

    // Folder A (2)
    [2, 2, 0],
    [2, 4, 1], [2, 5, 1], [2, 7, 1],
    [2, 8, 2],

    // Folder B (3)
    [3, 3, 0],
    [3, 6, 1],

    // Files (自己参照のみ)
    [4, 4, 0],
    [5, 5, 0],
    [6, 6, 0],

    // Folder A-3 (7)
    [7, 7, 0],
    [7, 8, 1],

    // File A-3-1 (8)
    [8, 8, 0],
  ];

  const seed = db.transaction(() => {
    for (const item of items) {
      insertItem.run(item.id, item.name, item.sort_order);
    }
    for (const path of paths) {
      insertPath.run(path[0], path[1], path[2]);
    }
  });

  seed();
  console.log('Closure table seeded');
};

// 実行
resetDatabase();
seedAdjacencyList();
seedClosureTable();

console.log('Database seeding completed!');
