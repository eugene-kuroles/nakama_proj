/**
 * 🚀 Точка входа React приложения
 * 
 * Этот файл:
 * 1. Импортирует React и ReactDOM
 * 2. Импортирует главный компонент App
 * 3. Монтирует App в DOM элемент с id="root"
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

// Находим элемент <div id="root"> в index.html
// и монтируем туда наше React приложение
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
