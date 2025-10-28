import { Hono } from 'hono';
import db from '../db/client.js';

const closure = new Hono();

// 全アイテムを取得
closure.get('/items', (c) => {
  const items = db.prepare(`
    SELECT * FROM items ORDER BY sort_order
  `).all();
  return c.json(items);
});

// ツリー構造で取得
closure.get('/tree', (c) => {
  const items = db.prepare(`SELECT * FROM items`).all() as any[];

  // 各アイテムの直接の親を取得
  const getDirectParent = (itemId: number) => {
    const parent = db.prepare(`
      SELECT ancestor_id
      FROM tree_paths
      WHERE descendant_id = ? AND depth = 1
    `).get(itemId) as any;
    return parent?.ancestor_id || null;
  };

  const buildTree = (parentId: number | null): any[] => {
    return items
      .filter((item) => getDirectParent(item.id) === parentId)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => ({
        ...item,
        children: buildTree(item.id),
      }));
  };

  const tree = buildTree(null);
  return c.json(tree);
});

// アイテム作成
closure.post('/items', async (c) => {
  const { name, parent_id, sort_order } = await c.req.json();

  const createItem = db.transaction(() => {
    // アイテムを挿入
    const result = db.prepare(`
      INSERT INTO items (name, sort_order)
      VALUES (?, ?)
    `).run(name, sort_order || 0);

    const newId = result.lastInsertRowid as number;

    // 自己参照パスを追加
    db.prepare(`
      INSERT INTO tree_paths (ancestor_id, descendant_id, depth)
      VALUES (?, ?, 0)
    `).run(newId, newId);

    // 親が指定されている場合、親の全祖先とのパスを追加
    if (parent_id) {
      db.prepare(`
        INSERT INTO tree_paths (ancestor_id, descendant_id, depth)
        SELECT ancestor_id, ?, depth + 1
        FROM tree_paths
        WHERE descendant_id = ?
      `).run(newId, parent_id);
    }

    return newId;
  });

  const newId = createItem();

  const newItem = db.prepare(`
    SELECT * FROM items WHERE id = ?
  `).get(newId);

  return c.json(newItem, 201);
});

// アイテムの移動（親の変更）
closure.put('/items/:id/move', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { new_parent_id, sort_order } = await c.req.json();

  const moveItem = db.transaction(() => {
    // 現在のパス（自分とその子孫のパス）を削除（自己参照以外）
    db.prepare(`
      DELETE FROM tree_paths
      WHERE descendant_id IN (
        SELECT descendant_id
        FROM tree_paths
        WHERE ancestor_id = ?
      )
      AND ancestor_id NOT IN (
        SELECT descendant_id
        FROM tree_paths
        WHERE ancestor_id = ?
      )
    `).run(id, id);

    // 新しいパスを追加
    if (new_parent_id !== null) {
      // 新しい親の全祖先から、このノードとその子孫へのパスを追加
      db.prepare(`
        INSERT INTO tree_paths (ancestor_id, descendant_id, depth)
        SELECT supertree.ancestor_id, subtree.descendant_id,
               supertree.depth + subtree.depth + 1
        FROM tree_paths AS supertree
        CROSS JOIN tree_paths AS subtree
        WHERE supertree.descendant_id = ?
          AND subtree.ancestor_id = ?
      `).run(new_parent_id, id);
    }

    // ソート順を更新
    if (sort_order !== undefined) {
      db.prepare(`
        UPDATE items SET sort_order = ? WHERE id = ?
      `).run(sort_order, id);
    }
  });

  moveItem();

  const updated = db.prepare(`
    SELECT * FROM items WHERE id = ?
  `).get(id);

  return c.json(updated);
});

// アイテムの更新
closure.put('/items/:id', async (c) => {
  const id = c.req.param('id');
  const { name, sort_order } = await c.req.json();

  db.prepare(`
    UPDATE items
    SET name = COALESCE(?, name),
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name, sort_order, id);

  const updated = db.prepare(`
    SELECT * FROM items WHERE id = ?
  `).get(id);

  return c.json(updated);
});

// 複数アイテムのソート順を一括更新
closure.put('/items/bulk-sort', async (c) => {
  const updates = await c.req.json<Array<{ id: number; sort_order: number }>>();

  const updateMany = db.transaction((updates) => {
    const stmt = db.prepare(`
      UPDATE items SET sort_order = ? WHERE id = ?
    `);

    for (const update of updates) {
      stmt.run(update.sort_order, update.id);
    }
  });

  updateMany(updates);

  return c.json({ success: true, updated: updates.length });
});

// アイテム削除
closure.delete('/items/:id', (c) => {
  const id = c.req.param('id');

  db.prepare(`DELETE FROM tree_paths WHERE ancestor_id = ? OR descendant_id = ?`).run(id, id);
  db.prepare(`DELETE FROM items WHERE id = ?`).run(id);

  return c.json({ success: true });
});

// デバッグ用：パスを見やすく取得
closure.get('/debug/paths', (c) => {
  const paths = db.prepare(`
    SELECT
      tp.ancestor_id,
      (SELECT name FROM items WHERE id = tp.ancestor_id) as ancestor_name,
      tp.descendant_id,
      (SELECT name FROM items WHERE id = tp.descendant_id) as descendant_name,
      tp.depth
    FROM tree_paths tp
    ORDER BY tp.ancestor_id, tp.depth, tp.descendant_id
  `).all();

  return c.json(paths);
});

// デバッグ用：全アイテムを階層付きで取得
closure.get('/debug', (c) => {
  const items = db.prepare(`
    SELECT
      i.id,
      i.name,
      i.sort_order,
      (
        SELECT ancestor_id
        FROM tree_paths
        WHERE descendant_id = i.id AND depth = 1
        LIMIT 1
      ) as parent_id,
      (
        SELECT name
        FROM items
        WHERE id = (
          SELECT ancestor_id
          FROM tree_paths
          WHERE descendant_id = i.id AND depth = 1
          LIMIT 1
        )
      ) as parent_name
    FROM items i
    ORDER BY i.sort_order
  `).all();

  return c.json(items);
});

export default closure;
