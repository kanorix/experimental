import db from './client.js';

// 隣接リスト方式のテーブル
export const createAdjacencyListSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES nodes(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
    CREATE INDEX IF NOT EXISTS idx_nodes_sort_order ON nodes(sort_order);
  `);
};

// 閉包テーブル方式のテーブル
export const createClosureTableSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tree_paths (
      ancestor_id INTEGER NOT NULL,
      descendant_id INTEGER NOT NULL,
      depth INTEGER NOT NULL,
      PRIMARY KEY (ancestor_id, descendant_id),
      FOREIGN KEY (ancestor_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (descendant_id) REFERENCES items(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tree_paths_ancestor ON tree_paths(ancestor_id);
    CREATE INDEX IF NOT EXISTS idx_tree_paths_descendant ON tree_paths(descendant_id);
    CREATE INDEX IF NOT EXISTS idx_tree_paths_depth ON tree_paths(depth);
  `);
};

export const initializeDatabase = () => {
  createAdjacencyListSchema();
  createClosureTableSchema();
  console.log('Database schemas initialized');
};
