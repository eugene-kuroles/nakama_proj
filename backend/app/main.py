"""
🚀 Главный файл FastAPI приложения.

Здесь:
- Создаётся приложение FastAPI
- Настраивается CORS (разрешение запросов от фронтенда)
- Регистрируются эндпоинты (API маршруты)
- Создаются таблицы в базе данных при запуске

Запуск:
    cd backend
    uvicorn app.main:app --reload --port 8000

После запуска:
    - API доступен: http://localhost:8000
    - Документация: http://localhost:8000/docs (Swagger UI)
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db
from .models import Score
from .schemas import (
    ScoreCreate,
    ScoreResponse,
    LeaderboardResponse,
    BestScoreResponse,
    MessageResponse
)

# ==============================================================================
# Создание приложения FastAPI
# ==============================================================================

app = FastAPI(
    title="🐍 Snake Game API",
    description="API для игры Змейка — сохранение результатов и таблица лидеров",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI доступен по /docs
    redoc_url="/redoc"  # ReDoc доступен по /redoc
)

# ==============================================================================
# Настройка CORS (Cross-Origin Resource Sharing)
# ==============================================================================
# CORS нужен чтобы фронтенд (React на порту 5173) мог
# отправлять запросы к бэкенду (FastAPI на порту 8000).
# Без этого браузер заблокирует запросы из-за политики безопасности.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (React)
        "http://localhost:3000",  # На случай другого порта
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,  # Разрешить cookies
    allow_methods=["*"],     # Разрешить все HTTP методы (GET, POST, etc.)
    allow_headers=["*"],     # Разрешить все заголовки
)

# ==============================================================================
# Создание таблиц при запуске
# ==============================================================================
# Это создаст таблицу scores в файле snake.db если её ещё нет

Base.metadata.create_all(bind=engine)


# ==============================================================================
# API Эндпоинты (маршруты)
# ==============================================================================

@app.get("/", response_model=MessageResponse)
async def root():
    """
    Корневой эндпоинт — проверка что сервер работает.
    
    Returns:
        Приветственное сообщение
    """
    return MessageResponse(
        message="🐍 Snake Game API is running! Visit /docs for documentation."
    )


@app.get("/api/health", response_model=MessageResponse)
async def health_check():
    """
    Health check — проверка "здоровья" сервера.
    
    Используется для мониторинга: если сервер отвечает — значит работает.
    
    Returns:
        Статус OK
    """
    return MessageResponse(message="OK", success=True)


@app.post("/api/scores", response_model=ScoreResponse)
async def create_score(score_data: ScoreCreate, db: Session = Depends(get_db)):
    """
    💾 Сохранить результат игры.
    
    Вызывается после окончания игры для сохранения счёта.
    
    Args:
        score_data: Данные результата (имя игрока, очки)
        db: Сессия базы данных (подставляется автоматически)
    
    Returns:
        Созданная запись с ID и рангом
    
    Example:
        POST /api/scores
        {"player_name": "Игрок1", "score": 150}
    """
    # Создаём новую запись в базе данных
    db_score = Score(
        player_name=score_data.player_name or "Player",
        score=score_data.score
    )
    
    db.add(db_score)      # Добавляем в сессию
    db.commit()           # Сохраняем в БД
    db.refresh(db_score)  # Обновляем объект (получаем ID)
    
    # Вычисляем ранг (место в рейтинге)
    # Считаем сколько результатов лучше текущего
    better_scores_count = db.query(Score).filter(
        Score.score > db_score.score
    ).count()
    rank = better_scores_count + 1  # +1 потому что ранг начинается с 1
    
    # Возвращаем ответ
    return ScoreResponse(
        id=db_score.id,
        player_name=db_score.player_name,
        score=db_score.score,
        played_at=db_score.played_at,
        rank=rank
    )


@app.get("/api/scores", response_model=LeaderboardResponse)
async def get_leaderboard(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    🏆 Получить таблицу лидеров.
    
    Возвращает топ-N лучших результатов, отсортированных по убыванию.
    
    Args:
        limit: Сколько записей вернуть (по умолчанию 10, максимум 100)
        db: Сессия базы данных
    
    Returns:
        Список лучших результатов с рангами
    
    Example:
        GET /api/scores?limit=10
    """
    # Ограничиваем limit разумными значениями
    limit = min(max(limit, 1), 100)
    
    # Получаем лучшие результаты, сортируем по очкам (убывание)
    scores = db.query(Score).order_by(Score.score.desc()).limit(limit).all()
    
    # Считаем общее количество игр
    total_games = db.query(Score).count()
    
    # Формируем ответ с рангами
    scores_with_ranks = [
        ScoreResponse(
            id=score.id,
            player_name=score.player_name,
            score=score.score,
            played_at=score.played_at,
            rank=idx + 1  # Ранг = позиция в списке + 1
        )
        for idx, score in enumerate(scores)
    ]
    
    return LeaderboardResponse(
        scores=scores_with_ranks,
        total_games=total_games
    )


@app.get("/api/scores/best", response_model=BestScoreResponse)
async def get_best_score(db: Session = Depends(get_db)):
    """
    ⭐ Получить лучший результат.
    
    Возвращает максимальный счёт среди всех игр.
    
    Args:
        db: Сессия базы данных
    
    Returns:
        Лучший результат и общее количество игр
    
    Example:
        GET /api/scores/best
    """
    # Получаем максимальный счёт
    best = db.query(func.max(Score.score)).scalar()
    
    # Считаем общее количество игр
    total = db.query(Score).count()
    
    return BestScoreResponse(
        best_score=best,
        total_games=total
    )


@app.delete("/api/scores", response_model=MessageResponse)
async def clear_scores(db: Session = Depends(get_db)):
    """
    🗑️ Очистить все результаты.
    
    ⚠️ Внимание: удаляет ВСЕ записи! Используйте осторожно.
    
    Args:
        db: Сессия базы данных
    
    Returns:
        Сообщение об успешной очистке
    """
    deleted_count = db.query(Score).delete()
    db.commit()
    
    return MessageResponse(
        message=f"Удалено записей: {deleted_count}",
        success=True
    )


# ==============================================================================
# Обработка ошибок
# ==============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Глобальный обработчик ошибок."""
    return HTTPException(
        status_code=500,
        detail=f"Внутренняя ошибка сервера: {str(exc)}"
    )
