# ツリー構造ソートテスト

ツリー構造のドラッグ&ドロップとデータベーステストアプリケーション

## 概要

- **隣接リスト (Adjacency List)** と **閉包テーブル (Closure Table)** の2つのツリー構造実装を比較
- ドラッグ&ドロップでツリーを操作
- リアルタイムでデータベースの状態を可視化

## 技術スタック

### バックエンド
- **Runtime**: Bun
- **Framework**: Hono
- **Database**: SQLite (better-sqlite3)
- **Language**: TypeScript

### フロントエンド
- **Framework**: React
- **Build**: Vite
- **DnD**: @dnd-kit
- **Language**: TypeScript

## セットアップ

### 1. 依存関係のインストール

```bash
# バックエンド
cd backend
bun install

# フロントエンド
cd ../frontend
bun install
```

### 2. データベースの初期化

```bash
cd backend
bun run seed
```

### 3. サーバー起動

```bash
# バックエンド (ターミナル1)
cd backend
bun run dev

# フロントエンド (ターミナル2)
cd frontend
bun run dev
```

## アクセス

- フロントエンド: http://localhost:5173
- バックエンドAPI: http://localhost:3000

## データ構造

### 隣接リスト (Adjacency List)

**テーブル: nodes**
| カラム | 型 | 説明 |
|--------|---------|-------------|
| id | INTEGER | 主キー |
| name | TEXT | ノード名 |
| parent_id | INTEGER | 親ノードID |
| sort_order | INTEGER | 並び順 |

**メリット:**
- シンプルな構造
- 直接の親子関係が明確

**デメリット:**
- 深い階層の取得に複数クエリが必要

### 閉包テーブル (Closure Table)

**テーブル: items**
| カラム | 型 | 説明 |
|--------|---------|-------------|
| id | INTEGER | 主キー |
| name | TEXT | アイテム名 |
| sort_order | INTEGER | 並び順 |

**テーブル: tree_paths**
| カラム | 型 | 説明 |
|--------|---------|-------------|
| ancestor_id | INTEGER | 祖先ID |
| descendant_id | INTEGER | 子孫ID |
| depth | INTEGER | 階層の深さ |

**メリット:**
- 全階層を1クエリで取得可能
- 部分木の移動が高速

**デメリット:**
- データ量が多い
- 更新ロジックが複雑

## API エンドポイント

### 隣接リスト

- `GET /api/adjacency/tree` - ツリー構造で取得
- `GET /api/adjacency/nodes` - 全ノード取得
- `GET /api/adjacency/debug` - デバッグ情報
- `PUT /api/adjacency/nodes/bulk-sort` - 並び順一括更新

### 閉包テーブル

- `GET /api/closure/tree` - ツリー構造で取得
- `GET /api/closure/items` - 全アイテム取得
- `GET /api/closure/debug` - デバッグ情報
- `GET /api/closure/debug/paths` - パス情報
- `PUT /api/closure/items/:id/move` - アイテム移動
- `PUT /api/closure/items/bulk-sort` - 並び順一括更新

## 使い方

1. タブで「隣接リスト」または「閉包テーブル」を選択
2. 左側のツリーでアイテムをドラッグ&ドロップ
3. 右側でデータベースのテーブル内容をリアルタイム確認

## プロジェクト構造

```
sort/
├── backend/
│   ├── src/
│   │   ├── index.ts           # Honoサーバー
│   │   ├── db/
│   │   │   ├── client.ts      # DB接続
│   │   │   ├── schema.ts      # スキーマ定義
│   │   │   └── seed.ts        # テストデータ
│   │   └── routes/
│   │       ├── adjacency.ts   # 隣接リストAPI
│   │       └── closure.ts     # 閉包テーブルAPI
│   └── database.sqlite        # SQLiteデータベース
│
└── frontend/
    ├── src/
    │   ├── App.tsx            # メインコンポーネント
    │   ├── main.tsx           # エントリポイント
    │   ├── components/
    │   │   ├── TreeNode.tsx        # ツリーノード
    │   │   ├── AdjacencyTree.tsx   # 隣接リスト画面
    │   │   └── ClosureTree.tsx     # 閉包テーブル画面
    │   └── api/
    │       └── client.ts      # APIクライアント
    └── index.html
```
