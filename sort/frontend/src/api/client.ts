const API_BASE = 'http://localhost:3000/api';

export interface TreeNode {
  id: number;
  name: string;
  parent_id?: number | null;
  sort_order: number;
  children?: TreeNode[];
}

export interface ClosureItem {
  id: number;
  name: string;
  sort_order: number;
  children?: ClosureItem[];
}

// 隣接リスト API
export const adjacencyAPI = {
  getTree: async (): Promise<TreeNode[]> => {
    const res = await fetch(`${API_BASE}/adjacency/tree`);
    return res.json();
  },

  getNodes: async () => {
    const res = await fetch(`${API_BASE}/adjacency/nodes`);
    return res.json();
  },

  getDebug: async () => {
    const res = await fetch(`${API_BASE}/adjacency/debug`);
    return res.json();
  },

  updateNodeSort: async (updates: Array<{ id: number; parent_id: number | null; sort_order: number }>) => {
    const res = await fetch(`${API_BASE}/adjacency/nodes/bulk-sort`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};

// 閉包テーブル API
export const closureAPI = {
  getTree: async (): Promise<ClosureItem[]> => {
    const res = await fetch(`${API_BASE}/closure/tree`);
    return res.json();
  },

  getItems: async () => {
    const res = await fetch(`${API_BASE}/closure/items`);
    return res.json();
  },

  getDebug: async () => {
    const res = await fetch(`${API_BASE}/closure/debug`);
    return res.json();
  },

  getDebugPaths: async () => {
    const res = await fetch(`${API_BASE}/closure/debug/paths`);
    return res.json();
  },

  moveItem: async (id: number, new_parent_id: number | null, sort_order: number) => {
    const res = await fetch(`${API_BASE}/closure/items/${id}/move`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_parent_id, sort_order }),
    });
    return res.json();
  },

  updateItemSort: async (updates: Array<{ id: number; sort_order: number }>) => {
    const res = await fetch(`${API_BASE}/closure/items/bulk-sort`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },
};
