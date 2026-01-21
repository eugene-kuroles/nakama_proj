/**
 * 🐍 Хук игровой логики змейки
 * 
 * Содержит всю логику игры:
 * - Состояние змейки (позиции сегментов)
 * - Состояние еды (разные типы)
 * - Динамические препятствия
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
export const INITIAL_OBSTACLES = 5; // Начальное количество препятствий
export const MAX_OBSTACLES = 15;    // Максимальное количество препятствий

// Типы еды с разными очками и иконками
export const FOOD_TYPES = [
  { type: 'apple', emoji: '🍎', points: 10, color: '#ff3366' },
  { type: 'cherry', emoji: '🍒', points: 15, color: '#ff1493' },
  { type: 'orange', emoji: '🍊', points: 10, color: '#ff8c00' },
  { type: 'grape', emoji: '🍇', points: 20, color: '#9b59b6' },
  { type: 'banana', emoji: '🍌', points: 10, color: '#f1c40f' },
  { type: 'watermelon', emoji: '🍉', points: 25, color: '#2ecc71' },
  { type: 'coin', emoji: '🪙', points: 30, color: '#ffd700' },
  { type: 'gem', emoji: '💎', points: 50, color: '#00d4ff' },
  { type: 'bitcoin', emoji: '₿', points: 100, color: '#f7931a' },
  { type: 'ethereum', emoji: 'Ξ', points: 75, color: '#627eea' },
  { type: 'star', emoji: '⭐', points: 40, color: '#ffeb3b' },
];

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
 * Проверяет, занята ли позиция
 */
function isPositionOccupied(position, snake, obstacles = [], food = null) {
  // Проверяем змейку
  if (snake.some(segment => segment.x === position.x && segment.y === position.y)) {
    return true;
  }
  // Проверяем препятствия
  if (obstacles.some(obs => obs.x === position.x && obs.y === position.y)) {
    return true;
  }
  // Проверяем еду
  if (food && food.x === position.x && food.y === position.y) {
    return true;
  }
  return false;
}

/**
 * Генерирует позицию, не занятую другими объектами
 */
function generateFreePosition(snake, obstacles = [], food = null) {
  let position;
  let attempts = 0;
  do {
    position = randomPosition();
    attempts++;
    if (attempts > 1000) break; // Защита от бесконечного цикла
  } while (isPositionOccupied(position, snake, obstacles, food));
  return position;
}

/**
 * Генерирует еду случайного типа
 */
function generateFood(snake, obstacles) {
  const position = generateFreePosition(snake, obstacles);
  const foodType = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
  return {
    ...position,
    ...foodType,
  };
}

/**
 * Генерирует препятствия
 */
function generateObstacles(count, snake) {
  const obstacles = [];
  for (let i = 0; i < count; i++) {
    const position = generateFreePosition(snake, obstacles);
    obstacles.push(position);
  }
  return obstacles;
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
  
  const [snake, setSnake] = useState(getInitialSnake);
  const [food, setFood] = useState(() => {
    const initialSnake = getInitialSnake();
    return generateFood(initialSnake, []);
  });
  const [obstacles, setObstacles] = useState([]);
  const [direction, setDirection] = useState('RIGHT');
  const [nextDirection, setNextDirection] = useState('RIGHT');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [gameState, setGameState] = useState('start');
  const [obstacleCount, setObstacleCount] = useState(INITIAL_OBSTACLES);

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
    if (OPPOSITE[newDirection] === direction) {
      return;
    }
    setNextDirection(newDirection);
  }, [direction]);

  // ============================================================================
  // ОДИН ШАГ ИГРЫ
  // ============================================================================
  
  const gameStep = useCallback(() => {
    if (gameState !== 'playing') return;

    setSnake(currentSnake => {
      setDirection(nextDirection);
      const dir = DIRECTIONS[nextDirection];
      
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

      // Столкновение с собой
      const bodyWithoutTail = currentSnake.slice(0, -1);
      if (bodyWithoutTail.some(s => s.x === newHead.x && s.y === newHead.y)) {
        handleGameOver();
        return currentSnake;
      }

      // Столкновение с препятствием
      if (obstacles.some(obs => obs.x === newHead.x && obs.y === newHead.y)) {
        handleGameOver();
        return currentSnake;
      }

      // ========================================
      // ПОЕДАНИЕ ЕДЫ
      // ========================================
      
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      
      if (ateFood) {
        const points = food.points || 10;
        
        setScore(s => {
          const newScore = s + points;
          if (newScore > highScore) {
            setHighScore(newScore);
          }
          return newScore;
        });
        
        setSpeed(s => Math.max(s - SPEED_INCREMENT, MIN_SPEED));
        
        const newSnakeWithHead = [newHead, ...currentSnake];
        
        // Добавляем препятствие каждые 5 съеденных
        if (currentSnake.length % 5 === 0 && obstacleCount < MAX_OBSTACLES) {
          setObstacleCount(c => c + 1);
          setObstacles(obs => [...obs, generateFreePosition(newSnakeWithHead, obs, food)]);
        }
        
        setFood(generateFood(newSnakeWithHead, obstacles));
        
        return newSnakeWithHead;
      }

      // ========================================
      // ОБЫЧНОЕ ДВИЖЕНИЕ
      // ========================================
      
      const newSnake = [newHead, ...currentSnake.slice(0, -1)];
      return newSnake;
    });
  }, [gameState, nextDirection, food, obstacles, highScore, obstacleCount]);

  // ============================================================================
  // GAME OVER
  // ============================================================================
  
  const handleGameOver = useCallback(async () => {
    setGameState('gameover');
    
    const finalScore = score;
    if (finalScore > 0) {
      await saveScore('Player', finalScore);
    }
  }, [score]);

  // ============================================================================
  // УПРАВЛЕНИЕ ИГРОЙ
  // ============================================================================
  
  const startGame = useCallback(() => {
    const initialSnake = getInitialSnake();
    const initialObstacles = generateObstacles(INITIAL_OBSTACLES, initialSnake);
    
    setSnake(initialSnake);
    setObstacles(initialObstacles);
    setFood(generateFood(initialSnake, initialObstacles));
    setDirection('RIGHT');
    setNextDirection('RIGHT');
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setObstacleCount(INITIAL_OBSTACLES);
    setGameState('playing');
  }, []);

  const togglePause = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // ============================================================================
  // ВОЗВРАЩАЕМ ВСЁ НАРУЖУ
  // ============================================================================
  
  return {
    snake,
    food,
    obstacles,
    score,
    highScore,
    speed,
    gameState,
    direction,
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    gameStep,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
  };
}
