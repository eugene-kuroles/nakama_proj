/**
 * 🎮 Главный компонент игры
 * 
 * Содержит:
 * - Canvas для отрисовки змейки и еды
 * - Панель счёта
 * - Оверлеи (Start, Pause, Game Over)
 * - Обработку клавиатуры
 */

import { useRef, useEffect, useCallback } from 'react';
import { useSnake, DIRECTIONS } from '../hooks/useSnake';
import { useGameLoop, useKeyboard } from '../hooks/useGameLoop';

/**
 * Компонент игры Snake
 */
export function Game() {
  // Получаем всё состояние и методы из хука
  const {
    snake,
    food,
    score,
    highScore,
    speed,
    gameState,
    gridSize,
    cellSize,
    gameStep,
    changeDirection,
    startGame,
    togglePause,
    restartGame,
  } = useSnake();

  // Ссылка на canvas элемент
  const canvasRef = useRef(null);

  // Размер canvas в пикселях
  const canvasSize = gridSize * cellSize;

  // ============================================================================
  // ИГРОВОЙ ЦИКЛ
  // ============================================================================
  
  // Запускаем игровой цикл когда игра активна
  useGameLoop(gameStep, speed, gameState === 'playing');

  // ============================================================================
  // УПРАВЛЕНИЕ КЛАВИАТУРОЙ
  // ============================================================================
  
  useKeyboard({
    // Стрелки
    'ArrowUp': () => changeDirection('UP'),
    'ArrowDown': () => changeDirection('DOWN'),
    'ArrowLeft': () => changeDirection('LEFT'),
    'ArrowRight': () => changeDirection('RIGHT'),
    
    // WASD
    'KeyW': () => changeDirection('UP'),
    'KeyS': () => changeDirection('DOWN'),
    'KeyA': () => changeDirection('LEFT'),
    'KeyD': () => changeDirection('RIGHT'),
    
    // Пробел — пауза или старт
    'Space': () => {
      if (gameState === 'start') {
        startGame();
      } else if (gameState === 'gameover') {
        restartGame();
      } else {
        togglePause();
      }
    },
    
    // Enter — старт/рестарт
    'Enter': () => {
      if (gameState === 'start' || gameState === 'gameover') {
        startGame();
      }
    },
  });

  // ============================================================================
  // ОТРИСОВКА НА CANVAS
  // ============================================================================
  
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Очищаем canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Рисуем сетку (опционально, для красоты)
    drawGrid(ctx, canvasSize, cellSize);

    // Рисуем еду
    drawFood(ctx, food, cellSize);

    // Рисуем змейку
    drawSnake(ctx, snake, cellSize);

  }, [snake, food, canvasSize, cellSize]);

  // Перерисовываем при изменении состояния
  useEffect(() => {
    draw();
  }, [draw, snake, food]);

  // ============================================================================
  // РЕНДЕР
  // ============================================================================
  
  return (
    <div className="game-container">
      {/* Заголовок */}
      <header className="game-header">
        <h1 className="game-title">SNAKE</h1>
        <p className="game-subtitle">Классическая аркада</p>
      </header>

      {/* Панель счёта */}
      <div className="score-panel">
        <div className="score-item">
          <span className="score-label">Счёт</span>
          <span className={`score-value ${score > 0 ? 'bounce' : ''}`}>
            {score}
          </span>
        </div>
        <div className="score-item">
          <span className="score-label">Рекорд</span>
          <span className="score-value high-score">{highScore}</span>
        </div>
      </div>

      {/* Игровое поле */}
      <div className="game-canvas-container">
        <canvas
          ref={canvasRef}
          className="game-canvas show-grid"
          width={canvasSize}
          height={canvasSize}
        />

        {/* Оверлей START */}
        {gameState === 'start' && (
          <div className="game-overlay">
            <div className="overlay-title">🐍 SNAKE</div>
            <p className="overlay-text">Готовы начать?</p>
            <button className="btn btn-primary" onClick={startGame}>
              Играть
            </button>
            <p className="overlay-hint">или нажмите SPACE</p>
          </div>
        )}

        {/* Оверлей PAUSE */}
        {gameState === 'paused' && (
          <div className="game-overlay">
            <div className="overlay-title">⏸️ ПАУЗА</div>
            <button className="btn btn-primary" onClick={togglePause}>
              Продолжить
            </button>
            <p className="overlay-hint">или нажмите SPACE</p>
          </div>
        )}

        {/* Оверлей GAME OVER */}
        {gameState === 'gameover' && (
          <div className="game-overlay">
            <div className="overlay-title game-over">GAME OVER</div>
            <div className="overlay-score">{score}</div>
            <p className="overlay-text">
              {score >= highScore && score > 0 
                ? '🎉 Новый рекорд!' 
                : 'Очков набрано'}
            </p>
            <button className="btn btn-primary" onClick={restartGame}>
              Играть снова
            </button>
            <p className="overlay-hint">или нажмите ENTER</p>
          </div>
        )}
      </div>

      {/* Подсказки управления */}
      <div className="controls-hint">
        <div className="control-item">
          <span className="control-key">↑↓←→</span>
          <span>или</span>
          <span className="control-key">WASD</span>
          <span>Движение</span>
        </div>
        <div className="control-item">
          <span className="control-key">SPACE</span>
          <span>Пауза</span>
        </div>
      </div>
    </div>
  );
}

// ==============================================================================
// ФУНКЦИИ ОТРИСОВКИ
// ==============================================================================

/**
 * Рисует сетку на игровом поле
 */
function drawGrid(ctx, size, cellSize) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= size; i += cellSize) {
    // Вертикальные линии
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    // Горизонтальные линии
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
}

/**
 * Рисует еду с анимацией пульсации
 */
function drawFood(ctx, food, cellSize) {
  const x = food.x * cellSize;
  const y = food.y * cellSize;
  const padding = 3;
  const size = cellSize - padding * 2;

  // Свечение
  const gradient = ctx.createRadialGradient(
    x + cellSize / 2,
    y + cellSize / 2,
    0,
    x + cellSize / 2,
    y + cellSize / 2,
    cellSize
  );
  gradient.addColorStop(0, 'rgba(255, 51, 102, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 51, 102, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(x - cellSize / 2, y - cellSize / 2, cellSize * 2, cellSize * 2);

  // Сама еда (круг)
  ctx.fillStyle = '#ff3366';
  ctx.beginPath();
  ctx.arc(
    x + cellSize / 2,
    y + cellSize / 2,
    size / 2,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Блик
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(
    x + cellSize / 2 - size / 6,
    y + cellSize / 2 - size / 6,
    size / 6,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

/**
 * Рисует змейку с градиентом
 */
function drawSnake(ctx, snake, cellSize) {
  const padding = 2;

  snake.forEach((segment, index) => {
    const x = segment.x * cellSize + padding;
    const y = segment.y * cellSize + padding;
    const size = cellSize - padding * 2;

    // Градиент цвета от головы к хвосту
    const progress = index / snake.length;
    const color = interpolateColor(
      { r: 0, g: 255, b: 136 },   // Голова: яркий зелёный
      { r: 0, g: 100, b: 60 },    // Хвост: тёмный зелёный
      progress
    );

    // Свечение для головы
    if (index === 0) {
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 15;
    } else {
      ctx.shadowBlur = 0;
    }

    // Рисуем сегмент (скруглённый прямоугольник)
    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    roundRect(ctx, x, y, size, size, 6);
    ctx.fill();

    // Глаза для головы
    if (index === 0) {
      drawEyes(ctx, segment, cellSize, snake[1]);
    }
  });

  // Сбрасываем тень
  ctx.shadowBlur = 0;
}

/**
 * Рисует глаза змейки
 */
function drawEyes(ctx, head, cellSize, nextSegment) {
  const cx = head.x * cellSize + cellSize / 2;
  const cy = head.y * cellSize + cellSize / 2;

  // Определяем направление взгляда
  let dx = 0, dy = 0;
  if (nextSegment) {
    dx = head.x - nextSegment.x;
    dy = head.y - nextSegment.y;
  }

  const eyeOffset = 4;
  const eyeSize = 3;
  const pupilSize = 1.5;

  // Позиции глаз (зависят от направления)
  let eye1, eye2;
  if (dx !== 0) {
    // Движение по горизонтали
    eye1 = { x: cx + dx * 3, y: cy - eyeOffset };
    eye2 = { x: cx + dx * 3, y: cy + eyeOffset };
  } else {
    // Движение по вертикали
    eye1 = { x: cx - eyeOffset, y: cy + dy * 3 };
    eye2 = { x: cx + eyeOffset, y: cy + dy * 3 };
  }

  // Белки глаз
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eye1.x, eye1.y, eyeSize, 0, Math.PI * 2);
  ctx.arc(eye2.x, eye2.y, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  // Зрачки
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eye1.x + dx, eye1.y + dy, pupilSize, 0, Math.PI * 2);
  ctx.arc(eye2.x + dx, eye2.y + dy, pupilSize, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Рисует скруглённый прямоугольник
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Интерполяция цвета между двумя значениями
 */
function interpolateColor(color1, color2, factor) {
  return {
    r: Math.round(color1.r + (color2.r - color1.r) * factor),
    g: Math.round(color1.g + (color2.g - color1.g) * factor),
    b: Math.round(color1.b + (color2.b - color1.b) * factor),
  };
}
