/**
 * 🐍 Хук игровой логики змейки
 * 
 * Содержит всю логику игры:
 * - Состояние змейки (позиции сегментов)
 * - Состояние еды
 * - Счёт и рекорд
 * - Обработка движения и столкновений
 */

import { useState, useCallback, useEffect } from 'react';
import { saveScore, getBestScore } from '../api/scores';

// ==============================================================================
// КОНСТАНТЫ ИГРЫ
// ==============================================================================

export const GRID_SIZE = 20;        // Размер поля (20x20 клеток)
export const CELL_SIZE = 25;        // Размер одной клетки в пикселях
export const INITIAL_SPEED = 150;   // Начальная скорость (мс между шагами)
export const SPEED_INCREMENT = 3;   // Ускорение за каждую съеденную еду
export const MIN_SPEED = 60;        // Максимальная скорость (минимальная задержка)
export const POINTS_PER_FOOD = 10;  // Очков за одну еду

// Направления движения
export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Противоположные направления (нельзя развернуться на 180°)
const OPPOSITE = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// ==============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ==============================================================================

/**
 * Генерирует случайную позицию на поле
 */
function randomPosition() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE),
    y: Math.floor(Math.random() * GRID_SIZE),
  };
}

/**
 * Проверяет, занята ли позиция змейкой
 */
function isPositionOnSnake(position, snake) {
  return snake.some(segment => 
    segment.x === position.x && segment.y === position.y
  );
}

/**
 * Генерирует позицию еды, не занятую змейкой
 */
function generateFood(snake) {
  let food;
  do {
    food = randomPosition();
  } while (isPositionOnSnake(food, snake));
  return food;
}

/**
 * Начальная змейка (3 сегмента в центре поля)
 */
function getInitialSnake() {
  const centerX = Math.floor(GRID_SIZE / 2);
  const centerY = Math.floor(GRID_SIZE / 2);
  return [
    { x: centerX, y: centerY },         // Голова
    { x: centerX - 1, y: centerY },     // Тело
    { x: centerX - 2, y: centerY },     // Хвост
  ];
}

// ==============================================================================
// ОСНОВНОЙ ХУК
// ==============================================================================

/**
 * Хук со всей логикой игры Snake
 * 
 * @returns {Object} - Состояние и методы управления игрой
 */
export function useSnake() {
  // ============================================================================
  // СОСТОЯНИЕ
  // ============================================================================
  
  // Змейка: массив координат [{x, y}, {x, y}, ...]
  // Первый элемент — голова, последний — хвост
  const [snake, setSnake] = useState(getInitialSnake);
  
  // Еда: координаты {x, y}
  const [food, setFood] = useState(() => generateFood(getInitialSnake()));
  
  // Текущее направление движения
  const [direction, setDirection] = useState('RIGHT');
  
  // Следующее направление (буфер для плавного управления)
  const [nextDirection, setNextDirection] = useState('RIGHT');
  
  // Текущий счёт
  const [score, setScore] = useState(0);
  
  // Лучший результат (High Score)
  const [highScore, setHighScore] = useState(0);
  
  // Текущая скорость игры (мс между шагами)
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  // Состояние игры: 'start' | 'playing' | 'paused' | 'gameover'
  const [gameState, setGameState] = useState('start');

  // ============================================================================
  // ЗАГРУЗКА ЛУЧШЕГО РЕЗУЛЬТАТА ПРИ СТАРТЕ
  // ============================================================================
  
  useEffect(() => {
    async function loadHighScore() {
      const result = await getBestScore();
      if (result.best_score) {
        setHighScore(result.best_score);
      }
    }
    loadHighScore();
  }, []);

  // ============================================================================
  // ИЗМЕНЕНИЕ НАПРАВЛЕНИЯ
  // ============================================================================
  
  const changeDirection = useCallback((newDirection) => {
    // Нельзя развернуться на 180°
    if (OPPOSITE[newDirection] === direction) {
      return;
    }
    setNextDirection(newDirection);
  }, [direction]);

  // ============================================================================
  // ОДИН ШАГ ИГРЫ (вызывается каждый тик)
  // ============================================================================
  
  const gameStep = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(currentSnake => {
      // Применяем направление из буфера
      setDirection(nextDirection);
      const dir = DIRECTIONS[nextDirection];
      
      // Вычисляем новую позицию головы
      const head = currentSnake[0];
      const newHead = {
        x: head.x + dir.x,
        y: head.y + dir.y,
      };

      // ========================================
      // ПРОВЕРКА СТОЛКНОВЕНИЙ
      // ========================================
      
      // Столкновение со стеной
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE
      ) {
        handleGameOver();
        return currentSnake;
      }

      // Столкновение с собой (проверяем всё тело кроме хвоста)
      // Хвост не считается, т.к. он сдвинется
      const bodyWithoutTail = currentSnake.slice(0, -1);
      if (isPositionOnSnake(newHead, bodyWithoutTail)) {
        handleGameOver();
        return currentSnake;
      }

      // ========================================
      // ПОЕДАНИЕ ЕДЫ
      // ========================================
      
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      
      if (ateFood) {
        // Увеличиваем счёт
        setScore(s => {
          const newScore = s + POINTS_PER_FOOD;
          // Обновляем рекорд если побили
          if (newScore > highScore) {
            setHighScore(newScore);
          }
          return newScore;
        });
        
        // Увеличиваем скорость
        setSpeed(s => Math.max(s - SPEED_INCREMENT, MIN_SPEED));
        
        // Генерируем новую еду
        const newSnakeWithHead = [newHead, ...currentSnake];
        setFood(generateFood(newSnakeWithHead));
        
        // Возвращаем змейку БЕЗ удаления хвоста (она выросла)
        return newSnakeWithHead;
      }

      // ========================================
      // ОБЫЧНОЕ ДВИЖЕНИЕ
      // ========================================
      
      // Добавляем новую голову, удаляем хвост
      const newSnake = [newHead, ...currentSnake.slice(0, -1)];
      return newSnake;
    });
  }, [gameState, nextDirection, food, highScore]);

  // ============================================================================
  // GAME OVER
  // ============================================================================
  
  const handleGameOver = useCallback(async () => {
    setGameState('gameover');
    
    // Сохраняем результат на сервер
    const finalScore = score; // Захватываем текущий счёт
    if (finalScore > 0) {
      await saveScore('Player', finalScore);
    }
  }, [score]);

  // ============================================================================
  // УПРАВЛЕНИЕ ИГРОЙ
  // ============================================================================
  
  // Начать игру
  const startGame = useCallback(() => {
    setSnake(getInitialSnake());
    setFood(generateFood(getInitialSnake()));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState('playing');
  }, []);

  // Пауза/Продолжить
  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  // Перезапуск после Game Over
  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // ============================================================================
  // ВОЗВРАЩАЕМ ВСЁ НАРУЖУ
  // ============================================================================
  
  return {
    // Состояние
    snake,
    food,
    score,
    highScore,
    speed,
    gameState,
    direction,
    
    // Константы (для отрисовки)
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    
    // Методы
    gameStep,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
  };
}
