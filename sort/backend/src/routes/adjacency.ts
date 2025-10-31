import { Hono } from 'hono';
import db from '../db/client.js';

const adjacency = new Hono();

// 全ノードを取得
adjacency.get('/nodes', (c) => {
  const nodes = db.prepare(`
    SELECT * FROM nodes ORDER BY parent_id, sort_order
  `).all();
  return c.json(nodes);
});

// ツリー構造で取得
adjacency.get('/tree', (c) => {
  const nodes = db.prepare(`
    SELECT * FROM nodes ORDER BY parent_id, sort_order
  `).all();

  const buildTree = (parentId: number | null): any[] => {
    return nodes
      .filter((node: any) => node.parent_id === parentId)
      .map((node: any) => ({
        ...node,
        children: buildTree(node.id),
      }));
  };

  const tree = buildTree(null);
  return c.json(tree);
});

// ノード作成
adjacency.post('/nodes', async (c) => {
  const { name, parent_id, sort_order } = await c.req.json();

  const result = db.prepare(`
    INSERT INTO nodes (name, parent_id, sort_order)
    VALUES (?, ?, ?)
  `).run(name, parent_id, sort_order || 0);

  const newNode = db.prepare(`
    SELECT * FROM nodes WHERE id = ?
  `).get(result.lastInsertRowid);

  return c.json(newNode, 201);
});

// ノード更新（親やソート順の変更）
adjacency.put('/nodes/:id', async (c) => {
  const id = c.req.param('id');
  const { name, parent_id, sort_order } = await c.req.json();

  db.prepare(`
    UPDATE nodes
    SET name = COALESCE(?, name),
        parent_id = ?,
        sort_order = COALESCE(?, sort_order)
    WHERE id = ?
  `).run(name, parent_id, sort_order, id);

  const updated = db.prepare(`
    SELECT * FROM nodes WHERE id = ?
  `).get(id);

  return c.json(updated);
});

// 複数ノードのソート順を一括更新
adjacency.put('/nodes/bulk-sort', async (c) => {
  const updates = await c.req.json<Array<{ id: number; parent_id: number | null; sort_order: number }>>();

  const updateMany = db.transaction((updates) => {
    const stmt = db.prepare(`
      UPDATE nodes
      SET parent_id = ?, sort_order = ?
      WHERE id = ?
    `);

    for (const update of updates) {
      stmt.run(update.parent_id, update.sort_order, update.id);
    }
  });

  updateMany(updates);

  return c.json({ success: true, updated: updates.length });
});

// ノード削除
adjacency.delete('/nodes/:id', (c) => {
  const id = c.req.param('id');

  db.prepare(`DELETE FROM nodes WHERE id = ?`).run(id);

  return c.json({ success: true });
});

// デバッグ用：全データを見やすく取得
adjacency.get('/debug', (c) => {
  const nodes = db.prepare(`
    SELECT
      id,
      name,
      parent_id,
      sort_order,
      (SELECT name FROM nodes p WHERE p.id = nodes.parent_id) as parent_name
    FROM nodes
    ORDER BY
      COALESCE(parent_id, 0),
      sort_order
  `).all();

  return c.json(nodes);
});

export default adjacency;
