# 📈 AGENT 4 — Analytics & Data Processing

## Миссия
Создать сервисы аналитики: расчёт KPI, трендов, корреляций и предиктивной аналитики.

## Технологии
- Python 3.11+
- pandas
- numpy
- scipy (корреляции)
- scikit-learn (ML, предикшн)

## Задачи в порядке выполнения

### 1. KPI Calculations

**Файл: `backend/app/services/analytics/kpi.py`**

```python
class KPIService:
    """Расчёт ключевых показателей"""
    
    def calculate_average_score(
        self, 
        calls: List[Call], 
        date_from: date = None,
        date_to: date = None
    ) -> float:
        """Средний % по звонкам за период"""
        pass
    
    def calculate_calls_count(
        self,
        calls: List[Call],
        group_by: str = 'day'  # day, week, month
    ) -> Dict[str, int]:
        """Количество звонков по периодам"""
        pass
    
    def calculate_total_duration(
        self,
        calls: List[Call]
    ) -> int:
        """Общая длительность в секундах"""
        pass
    
    def calculate_manager_ranking(
        self,
        calls: List[Call],
        period: str = 'week'
    ) -> List[ManagerRanking]:
        """Рейтинг менеджеров"""
        pass
    
    def calculate_criteria_scores(
        self,
        calls: List[Call]
    ) -> Dict[str, CriteriaStats]:
        """Статистика по критериям"""
        pass
```

### 2. Trends & Dynamics

**Файл: `backend/app/services/analytics/trends.py`**

```python
class TrendsService:
    """Расчёт трендов и динамики"""
    
    def calculate_trend(
        self,
        values: List[float],
        period: int = 7  # дней для скользящего среднего
    ) -> TrendResult:
        """
        Определяет тренд: рост/падение/стабильно
        Returns: direction, change_percent, moving_average
        """
        pass
    
    def calculate_week_over_week(
        self,
        current_week: List[Call],
        previous_week: List[Call]
    ) -> WoWComparison:
        """Сравнение неделя к неделе"""
        pass
    
    def calculate_time_series(
        self,
        calls: List[Call],
        metric: str,  # 'score', 'count', 'duration'
        group_by: str  # 'day', 'week', 'month'
    ) -> List[TimeSeriesPoint]:
        """Временной ряд для графиков"""
        pass
    
    def detect_anomalies(
        self,
        values: List[float],
        threshold: float = 2.0  # стандартных отклонения
    ) -> List[AnomalyPoint]:
        """Обнаружение выбросов"""
        pass
```

### 3. Correlation Analysis

**Файл: `backend/app/services/analytics/correlations.py`**

```python
from scipy.stats import pearsonr, spearmanr

class CorrelationService:
    """Корреляционный анализ"""
    
    def calculate_criteria_correlations(
        self,
        calls: List[Call]
    ) -> CorrelationMatrix:
        """
        Матрица корреляций между критериями
        Какие критерии коррелируют друг с другом
        """
        pass
    
    def calculate_criteria_impact(
        self,
        calls: List[Call]
    ) -> List[CriteriaImpact]:
        """
        Влияние каждого критерия на итоговый %
        Сортировка по силе влияния
        """
        # Корреляция каждого критерия с final_percent
        pass
    
    def find_critical_criteria(
        self,
        calls: List[Call],
        threshold: float = 0.6
    ) -> List[Criteria]:
        """
        Критерии, которые больше всего влияют на результат
        """
        pass
    
    def calculate_manager_criteria_matrix(
        self,
        calls: List[Call]
    ) -> HeatMapData:
        """
        Матрица: менеджеры × критерии
        Для тепловой карты
        """
        pass
```

### 4. Aggregations

**Файл: `backend/app/services/analytics/aggregations.py`**

```python
class AggregationService:
    """Группировки и агрегации"""
    
    def aggregate_by_manager(
        self,
        calls: List[Call],
        metrics: List[str] = ['score', 'count', 'duration']
    ) -> List[ManagerAggregation]:
        """Агрегация по менеджерам"""
        pass
    
    def aggregate_by_criteria(
        self,
        calls: List[Call]
    ) -> List[CriteriaAggregation]:
        """Агрегация по критериям"""
        pass
    
    def aggregate_by_criteria_group(
        self,
        calls: List[Call]
    ) -> List[GroupAggregation]:
        """Агрегация по группам критериев"""
        pass
    
    def aggregate_by_period(
        self,
        calls: List[Call],
        period: str  # 'day', 'week', 'month'
    ) -> List[PeriodAggregation]:
        """Агрегация по периодам"""
        pass
    
    def calculate_percentiles(
        self,
        values: List[float]
    ) -> PercentilesResult:
        """P25, P50 (медиана), P75, P90"""
        pass
```

### 5. Predictions (ML)

**Файл: `backend/app/services/analytics/predictions.py`**

```python
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

class PredictionService:
    """Предиктивная аналитика"""
    
    def predict_next_period(
        self,
        time_series: List[TimeSeriesPoint],
        periods_ahead: int = 4
    ) -> List[PredictionPoint]:
        """
        Прогноз на N периодов вперёд
        Линейная регрессия
        """
        pass
    
    def predict_if_not_improve(
        self,
        manager_id: int,
        criteria_to_improve: List[int]
    ) -> ImprovementPrediction:
        """
        Что будет если не улучшить критерии X, Y, Z
        """
        pass
    
    def predict_score_improvement(
        self,
        current_scores: Dict[int, float],
        target_criteria: int,
        improvement_percent: float = 10
    ) -> float:
        """
        На сколько вырастет итоговый %, 
        если улучшить критерий X на Y%
        """
        pass
    
    def identify_improvement_priority(
        self,
        calls: List[Call],
        manager_id: int
    ) -> List[ImprovementSuggestion]:
        """
        Приоритезация: какие критерии улучшать в первую очередь
        На основе:
        - Текущего уровня (низкий = приоритет)
        - Влияния на результат (высокое = приоритет)
        - Сравнения с командой
        """
        pass
```

### 6. Report Builders

**Файл: `backend/app/services/reports/executive.py`**

```python
class ExecutiveReportBuilder:
    """Построитель отчёта для CEO"""
    
    def build(
        self,
        project_id: int,
        date_from: date,
        date_to: date
    ) -> ExecutiveReport:
        return ExecutiveReport(
            summary=self._build_summary(),
            trends=self._build_trends(),
            top_issues=self._build_top_issues(),
            manager_ranking=self._build_ranking(),
            risk_signals=self._build_risks()
        )
```

**Файл: `backend/app/services/reports/team.py`**

```python
class TeamReportBuilder:
    """Построитель отчёта для РОП"""
    
    def build(self, project_id: int, ...) -> TeamReport:
        return TeamReport(
            leaderboard=self._build_leaderboard(),
            criteria_heatmap=self._build_heatmap(),
            coaching_queue=self._build_coaching_queue(),
            team_trends=self._build_trends()
        )
```

**Файл: `backend/app/services/reports/manager.py`**

```python
class ManagerReportBuilder:
    """Построитель отчёта для менеджера"""
    
    def build(self, manager_id: int, ...) -> ManagerReport:
        return ManagerReport(
            my_kpis=self._build_kpis(),
            my_radar=self._build_radar_profile(),
            my_trend=self._build_trend(),
            growth_areas=self._build_growth_areas(),
            recent_calls=self._build_recent_calls()
        )
```

## Структура данных для графиков

```python
@dataclass
class TimeSeriesPoint:
    date: str  # "2025-01-06"
    value: float
    label: str  # "Week 2"

@dataclass
class HeatMapData:
    rows: List[str]      # ["Иванов", "Петров", ...]
    columns: List[str]   # ["Критерий 1", "Критерий 2", ...]
    values: List[List[float]]  # 2D матрица значений

@dataclass
class RadarChartData:
    labels: List[str]    # Названия критериев
    values: List[float]  # Значения менеджера
    team_avg: List[float]  # Средние по команде

@dataclass
class CorrelationMatrix:
    labels: List[str]
    matrix: List[List[float]]
```

## Критерии готовности
- [ ] KPI сервис рассчитывает все метрики
- [ ] Тренды определяются корректно
- [ ] Корреляции рассчитываются
- [ ] Агрегации работают по всем срезам
- [ ] Прогнозы генерируются
- [ ] Report Builders возвращают данные для UI

## Зависимости от других агентов
- Agent 1: Модели и доступ к БД
- Agent 5: Данные из Excel/API
