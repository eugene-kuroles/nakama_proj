/**
 * 🐍 Главный компонент приложения
 * 
 * Layout: Игра слева, Таблица лидеров справа
 */

import { useState, useEffect } from 'react';
import { Game } from './components/Game';
import { Leaderboard } from './components/Leaderboard';
import { checkServerHealth } from './api/scores';

function App() {
  const [serverOnline, setServerOnline] = useState(true);

  useEffect(() => {
    async function checkServer() {
      const isOnline = await checkServerHealth();
      setServerOnline(isOnline);
      if (!isOnline) {
        console.warn('⚠️ Backend сервер недоступен.');
      }
    }
    checkServer();
  }, []);

  return (
    <div className="app">
      {/* Предупреждение если сервер недоступен */}
      {!serverOnline && (
        <div className="server-warning">
          ⚠️ Backend недоступен. Запустите: cd backend && uvicorn app.main:app --reload
        </div>
      )}

      {/* Главный layout: игра + таблица лидеров */}
      <div className="app-layout">
        {/* Игра (слева) */}
        <Game />

        {/* Таблица лидеров (справа) */}
        <div className="sidebar">
          <Leaderboard />
          
          {/* Легенда еды */}
          <div className="food-legend">
            <h4 className="legend-title">🎁 Награды</h4>
            <div className="legend-items">
              <div className="legend-row">
                <span>🍎🍒🍊</span>
                <span className="legend-points">10-15</span>
              </div>
              <div className="legend-row">
                <span>🍇🍉</span>
                <span className="legend-points">20-25</span>
              </div>
              <div className="legend-row">
                <span>🪙⭐</span>
                <span className="legend-points">30-40</span>
              </div>
              <div className="legend-row">
                <span>💎</span>
                <span className="legend-points">50</span>
              </div>
              <div className="legend-row crypto">
                <span>₿ Ξ</span>
                <span className="legend-points">75-100</span>
              </div>
            </div>
          </div>

          {/* Информация о препятствиях */}
          <div className="obstacles-info">
            <h4 className="legend-title">🚧 Препятствия</h4>
            <p className="info-text">
              Появляются каждые 5 съеденных наград. Избегай столкновений!
            </p>
          </div>
        </div>
      </div>

      {/* Футер */}
      <footer className="app-footer">
        🐍 Snake Game • Создано с ❤️ в Cursor AI
      </footer>
    </div>
  );
}

export default App;
