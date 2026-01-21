/**
 * 🏆 Компонент таблицы лидеров
 * 
 * Показывает топ-10 лучших результатов.
 * Загружает данные с backend API.
 */

import { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/scores';

/**
 * Таблица лидеров
 */
export function Leaderboard() {
  // Состояние: список результатов
  const [scores, setScores] = useState([]);
  
  // Состояние: идёт загрузка
  const [loading, setLoading] = useState(true);
  
  // Состояние: общее количество игр
  const [totalGames, setTotalGames] = useState(0);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      const data = await getLeaderboard(10);
      setScores(data.scores);
      setTotalGames(data.total_games);
      setLoading(false);
    }
    
    loadLeaderboard();
  }, []);

  // Функция для обновления данных (можно вызвать извне)
  const refresh = async () => {
    const data = await getLeaderboard(10);
    setScores(data.scores);
    setTotalGames(data.total_games);
  };

  // Получить иконку для места
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return rank;
    }
  };

  // Получить класс для места
  const getRankClass = (rank) => {
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'bronze';
      default: return '';
    }
  };

  // Получить класс для строки
  const getItemClass = (rank) => {
    if (rank <= 3) return `top-${rank}`;
    return '';
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="leaderboard">
      {/* Заголовок */}
      <div className="leaderboard-header">
        <h3 className="leaderboard-title">
          🏆 Таблица лидеров
        </h3>
        {totalGames > 0 && (
          <span style={{ 
            fontSize: '0.75rem', 
            color: 'var(--text-secondary)',
            marginLeft: 'auto' 
          }}>
            Всего игр: {totalGames}
          </span>
        )}
      </div>

      {/* Список */}
      <div className="leaderboard-list">
        {loading ? (
          <div className="leaderboard-empty">Загрузка...</div>
        ) : scores.length === 0 ? (
          <div className="leaderboard-empty">
            Пока нет результатов.<br />
            Сыграйте первую игру!
          </div>
        ) : (
          scores.map((score) => (
            <div 
              key={score.id} 
              className={`leaderboard-item ${getItemClass(score.rank)}`}
            >
              <span className={`leaderboard-rank ${getRankClass(score.rank)}`}>
                {getRankIcon(score.rank)}
              </span>
              <span className="leaderboard-name">
                {score.player_name}
              </span>
              <span className="leaderboard-score">
                {score.score}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
