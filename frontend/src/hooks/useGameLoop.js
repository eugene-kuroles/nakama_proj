/**
 * 🎮 Хук игрового цикла
 * 
 * Игровой цикл — это бесконечный цикл, который:
 * 1. Обновляет состояние игры (двигает змейку)
 * 2. Отрисовывает кадр
 * 3. Повторяется с определённой скоростью
 * 
 * Хук (hook) — это функция React, которая позволяет
 * использовать состояние и жизненный цикл в компонентах.
 */

import { useCallback, useEffect, useRef } from 'react';

/**
 * Хук для создания игрового цикла с контролем скорости
 * 
 * @param {Function} callback - Функция, вызываемая каждый "тик" игры
 * @param {number} speed - Задержка между тиками в миллисекундах
 * @param {boolean} isRunning - Запущен ли цикл
 * 
 * @example
 * useGameLoop(() => {
 *   moveSnake();
 *   checkCollisions();
 * }, 150, isPlaying);
 */
export function useGameLoop(callback, speed, isRunning) {
  // useRef хранит значение между рендерами без вызова перерисовки
  const savedCallback = useRef();
  const intervalRef = useRef();

  // Сохраняем последнюю версию callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Запуск/остановка игрового цикла
  useEffect(() => {
    if (!isRunning) {
      // Если игра на паузе — останавливаем цикл
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Функция тика — вызывает сохранённый callback
    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    // Запускаем интервал с заданной скоростью
    intervalRef.current = setInterval(tick, speed);

    // Очистка при размонтировании или изменении зависимостей
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [speed, isRunning]);
}

/**
 * Хук для отслеживания нажатий клавиш
 * 
 * @param {Object} keyHandlers - Объект с обработчиками для каждой клавиши
 * 
 * @example
 * useKeyboard({
 *   'ArrowUp': () => setDirection('UP'),
 *   'Space': () => togglePause(),
 * });
 */
export function useKeyboard(keyHandlers) {
  const handleKeyDown = useCallback((event) => {
    const handler = keyHandlers[event.code] || keyHandlers[event.key];
    if (handler) {
      event.preventDefault(); // Отменяем стандартное поведение (например, скролл)
      handler(event);
    }
  }, [keyHandlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Хук для отрисовки на Canvas
 * 
 * @param {HTMLCanvasElement} canvasRef - Ссылка на canvas элемент
 * @param {Function} draw - Функция отрисовки
 * @param {Array} deps - Зависимости (когда перерисовывать)
 */
export function useCanvas(canvasRef, draw, deps = []) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    draw(ctx, canvas);
  }, [canvasRef, draw, ...deps]);
}
