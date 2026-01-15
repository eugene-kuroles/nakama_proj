/**
 * 🐍 Главный компонент приложения
 * 
 * Собирает всё вместе:
 * - Игру
 * - Таблицу лидеров
 */

import { useState, useEffect } from 'react';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { checkServerHealth } from './api/scores';

/**
 * Главный компонент App
 */
function App() {
  // Состояние: показывать ли таблицу лидеров
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  
  // Состояние: доступен ли сервер
  const [serverOnline, setServerOnline] = useState(true);

  // Проверяем доступность сервера при загрузке
  useEffect(() => {
    async function checkServer() {
      const isOnline = await checkServerHealth();
      setServerOnline(isOnline);
      if (!isOnline) {
        console.warn('⚠️ Backend сервер недоступен. Таблица лидеров не будет работать.');
      }
    }
    checkServer();
  }, []);

  return (
    <div className="app">
      {/* Предупреждение если сервер недоступен */}
      {!serverOnline && (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(255, 51, 102, 0.9)',
          color: 'white',
          borderRadius: '8px',
          fontSize: '0.9rem',
          zIndex: 1000,
        }}>
          ⚠️ Backend сервер недоступен. Запустите его командой: cd backend && uvicorn app.main:app --reload
        </div>
      )}

      {/* Основной контент: игра или таблица лидеров */}
      <div className="app-content" style={{
        display: 'flex',
        gap: '30px',
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: '20px',
      }}>
        {/* Игра */}
        <Game />

        {/* Таблица лидеров (справа от игры на десктопе) */}
        <Leaderboard />
      </div>

      {/* Футер */}
      <footer style={{
        position: 'fixed',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        opacity: 0.5,
      }}>
        🐍 Snake Game • Создано с ❤️ в Cursor AI
      </footer>
    </div>
  );
}

export default App;
