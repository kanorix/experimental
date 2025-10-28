import React, { useState } from 'react';
import { AdjacencyTree } from './components/AdjacencyTree';
import { ClosureTree } from './components/ClosureTree';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'adjacency' | 'closure'>('adjacency');

  return (
    <div className="app">
      <header className="app-header">
        <h1>ツリー構造ソートテスト</h1>
        <p>左側でドラッグ&ドロップ、右側でデータベースの状態を確認</p>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'adjacency' ? 'active' : ''}`}
          onClick={() => setActiveTab('adjacency')}
        >
          隣接リスト
        </button>
        <button
          className={`tab ${activeTab === 'closure' ? 'active' : ''}`}
          onClick={() => setActiveTab('closure')}
        >
          閉包テーブル
        </button>
      </div>

      <div className="content">
        {activeTab === 'adjacency' ? <AdjacencyTree /> : <ClosureTree />}
      </div>
    </div>
  );
}

export default App;
