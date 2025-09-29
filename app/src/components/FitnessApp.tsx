import { useState } from 'react';
import { Header } from './Header';
import { RecordForm } from './RecordForm';
import { RecordList } from './RecordList';
import '../styles/FitnessApp.css';

export function FitnessApp() {
  const [activeTab, setActiveTab] = useState<'add' | 'records'>('add');

  return (
    <div className="fitness-app">
      <Header />
      <main className="main-content">
        <div>
          <div className="tab-navigation">
            <nav className="tab-nav">
              <button
                onClick={() => setActiveTab('add')}
                className={`tab-button ${activeTab === 'add' ? 'active' : 'inactive'}`}
              >
                Add Record
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`tab-button ${activeTab === 'records' ? 'active' : 'inactive'}`}
              >
                My Records
              </button>
            </nav>
          </div>

          {activeTab === 'add' && <RecordForm />}
          {activeTab === 'records' && <RecordList />}
        </div>
      </main>
    </div>
  );
}

