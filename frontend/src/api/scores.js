/**
 * 📡 API модуль для работы с результатами игры
 * 
 * Этот файл содержит функции для отправки запросов к Backend.
 * Все запросы идут на http://localhost:8000/api/
 */

// Базовый URL нашего Backend API
const API_BASE_URL = 'http://localhost:8000/api';

/**
 * 💾 Сохранить результат игры
 * 
 * Отправляет POST запрос на сервер с результатом.
 * 
 * @param {string} playerName - Имя игрока
 * @param {number} score - Набранные очки
 * @returns {Promise<object>} - Сохранённый результат с рангом
 * 
 * @example
 * const result = await saveScore('Игрок1', 150);
 * console.log(result.rank); // 3
 */
export async function saveScore(playerName, score) {
  try {
    const response = await fetch(`${API_BASE_URL}/scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_name: playerName || 'Player',
        score: score,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ошибка сохранения: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка сохранения результата:', error);
    // Возвращаем null если сервер недоступен
    // (игра продолжит работать, просто без сохранения)
    return null;
  }
}

/**
 * 🏆 Получить таблицу лидеров
 * 
 * @param {number} limit - Сколько записей получить (по умолчанию 10)
 * @returns {Promise<object>} - Объект с массивом scores и total_games
 * 
 * @example
 * const leaderboard = await getLeaderboard(10);
 * leaderboard.scores.forEach(s => console.log(s.player_name, s.score));
 */
export async function getLeaderboard(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/scores?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`Ошибка получения: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка загрузки таблицы лидеров:', error);
    // Возвращаем пустой результат если сервер недоступен
    return { scores: [], total_games: 0 };
  }
}

/**
 * ⭐ Получить лучший результат
 * 
 * @returns {Promise<object>} - Объект с best_score и total_games
 * 
 * @example
 * const best = await getBestScore();
 * console.log('Рекорд:', best.best_score);
 */
export async function getBestScore() {
  try {
    const response = await fetch(`${API_BASE_URL}/scores/best`);

    if (!response.ok) {
      throw new Error(`Ошибка получения: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка загрузки лучшего результата:', error);
    return { best_score: null, total_games: 0 };
  }
}

/**
 * 🗑️ Очистить все результаты (для разработки)
 * 
 * @returns {Promise<object>} - Результат операции
 */
export async function clearScores() {
  try {
    const response = await fetch(`${API_BASE_URL}/scores`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Ошибка очистки: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Ошибка очистки результатов:', error);
    return null;
  }
}

/**
 * 🔍 Проверить доступность сервера
 * 
 * @returns {Promise<boolean>} - true если сервер доступен
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
