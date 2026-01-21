# 🔌 AGENT 5 — Integration & API

## Миссия
Создать интеграции: клиент для nakama API, парсер Excel файлов, синхронизация данных.

## Технологии
- Python 3.11+
- httpx (async HTTP client)
- pandas + openpyxl (Excel)
- Celery + Redis (фоновые задачи)

## Задачи в порядке выполнения

### 1. Excel Parser — Criteria Sheet

**Файл: `backend/app/integrations/excel/criteria.py`**

```python
import pandas as pd

class CriteriaSheetParser:
    """Парсер листа Criteria из Excel"""
    
    def parse(self, file_path: str) -> ParsedCriteria:
        """
        Парсит лист с критериями.
        
        Структура листа:
        | Этап | Номер | Название критерия | Prompt | Оценка 100% |
        
        Returns:
            ParsedCriteria with groups and criteria list
        """
        df = pd.read_excel(file_path, sheet_name=self._find_criteria_sheet(file_path))
        
        groups = []
        criteria = []
        current_group = None
        
        for idx, row in df.iterrows():
            # Если есть значение в первом столбце — это группа
            if pd.notna(row.iloc[0]) and str(row.iloc[0]).strip():
                current_group = CriteriaGroup(
                    name=str(row.iloc[0]).strip(),
                    order=len(groups)
                )
                groups.append(current_group)
            
            # Если есть номер — это критерий
            if pd.notna(row.iloc[1]):
                criteria.append(Criteria(
                    group=current_group,
                    number=int(row.iloc[1]),
                    name=str(row.iloc[2]).strip() if pd.notna(row.iloc[2]) else "",
                    prompt=str(row.iloc[3]).strip() if pd.notna(row.iloc[3]) else None,
                    in_final_score=str(row.iloc[4]).strip().lower() == 'да' if pd.notna(row.iloc[4]) else False
                ))
        
        return ParsedCriteria(groups=groups, criteria=criteria)
    
    def _find_criteria_sheet(self, file_path: str) -> str:
        """Находит лист с критериями (может называться Criteria, Criteria 10.12 и тд)"""
        xlsx = pd.ExcelFile(file_path)
        for sheet in xlsx.sheet_names:
            if 'criteria' in sheet.lower():
                return sheet
        raise ValueError("Criteria sheet not found")
```

### 2. Excel Parser — AI Sheet

**Файл: `backend/app/integrations/excel/ai_sheet.py`**

```python
class AISheetParser:
    """Парсер листа AI из Excel"""
    
    def parse(
        self, 
        file_path: str, 
        criteria: List[Criteria]
    ) -> List[ParsedCall]:
        """
        Парсит лист AI с данными звонков.
        
        Структура листа:
        - Row 0: Ключи системы (number, call_name, transcription, ...)
        - Row 1: Группы критериев (для визуализации)
        - Row 2: Заголовки столбцов (человекочитаемые)
        - Row 3+: Данные звонков
        
        Столбцы критериев имеют формат:
        - "{N} {Название}" — score
        - "{N} ... Reason" — reason
        - "{N} ... Quote" — quote
        """
        df = pd.read_excel(file_path, sheet_name='AI', header=None)
        
        # Извлекаем заголовки
        system_keys = df.iloc[0].tolist()  # Ключи
        headers = df.iloc[2].tolist()       # Человекочитаемые названия
        
        # Определяем структуру столбцов
        column_mapping = self._build_column_mapping(headers, criteria)
        
        calls = []
        for idx in range(3, len(df)):
            row = df.iloc[idx]
            call = self._parse_call_row(row, column_mapping, criteria)
            if call:
                calls.append(call)
        
        return calls
    
    def _build_column_mapping(
        self, 
        headers: List, 
        criteria: List[Criteria]
    ) -> ColumnMapping:
        """
        Определяет какой столбец содержит какие данные.
        
        Returns:
            ColumnMapping with:
            - meta_columns: {col_idx: 'call_date', 'manager_name', ...}
            - criteria_columns: {criteria_id: (score_col, reason_col, quote_col)}
            - formula_columns: {col_idx: 'FINAL Average Call Percent'}
        """
        mapping = ColumnMapping()
        
        # Мета-данные (до критериев)
        meta_keywords = {
            'дата звонка': 'call_date',
            'call_date': 'call_date',
            'менеджер': 'manager_name',
            'фио менеджера': 'manager_name',
            'длительность': 'duration',
            'id звонка': 'call_id',
            'неделя': 'call_week',
            'week': 'call_week',
        }
        
        for col_idx, header in enumerate(headers):
            if not header or not isinstance(header, str):
                continue
            
            header_lower = str(header).lower().strip()
            
            # Проверяем мета-данные
            for keyword, field in meta_keywords.items():
                if keyword in header_lower:
                    mapping.meta_columns[col_idx] = field
                    break
            
            # Проверяем критерии (начинаются с номера)
            match = re.match(r'^(\d+)\s+', str(header).strip())
            if match:
                criteria_num = int(match.group(1))
                # Определяем тип: score, reason или quote
                if 'reason' in header_lower:
                    mapping.add_reason_column(criteria_num, col_idx)
                elif 'quote' in header_lower:
                    mapping.add_quote_column(criteria_num, col_idx)
                else:
                    mapping.add_score_column(criteria_num, col_idx)
            
            # Проверяем формулы
            if 'final' in header_lower or 'average' in header_lower:
                mapping.formula_columns[col_idx] = header
        
        return mapping
    
    def _parse_call_row(
        self, 
        row: pd.Series, 
        mapping: ColumnMapping,
        criteria: List[Criteria]
    ) -> Optional[ParsedCall]:
        """Парсит одну строку звонка"""
        # Извлекаем мета-данные
        meta = {}
        for col_idx, field in mapping.meta_columns.items():
            value = row.iloc[col_idx]
            if pd.notna(value):
                meta[field] = value
        
        # Извлекаем оценки критериев
        scores = []
        for criteria_num, columns in mapping.criteria_columns.items():
            score_col, reason_col, quote_col = columns
            
            scores.append(CallScore(
                criteria_number=criteria_num,
                score=self._parse_score(row.iloc[score_col]) if score_col else None,
                reason=str(row.iloc[reason_col]).strip() if reason_col and pd.notna(row.iloc[reason_col]) else None,
                quote=str(row.iloc[quote_col]).strip() if quote_col and pd.notna(row.iloc[quote_col]) else None
            ))
        
        # Извлекаем итоговый %
        final_percent = None
        for col_idx, name in mapping.formula_columns.items():
            if 'final' in name.lower():
                value = row.iloc[col_idx]
                if pd.notna(value):
                    final_percent = float(value)
        
        return ParsedCall(
            metadata=meta,
            scores=scores,
            final_percent=final_percent
        )
    
    def _parse_score(self, value) -> Optional[str]:
        """Парсит значение оценки (может быть числом, текстом или пусто)"""
        if pd.isna(value):
            return None
        if isinstance(value, (int, float)):
            return str(int(value))
        return str(value).strip()
```

### 3. nakama API Client

**Файл: `backend/app/integrations/nakama/client.py`**

```python
import httpx
from typing import Optional, List

class NakamaAPIClient:
    """Клиент для nakama API"""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {"API-Access-Key": api_key}
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.headers,
            timeout=30.0
        )
    
    async def get_projects(self) -> List[dict]:
        """Получить список проектов"""
        response = await self.client.get("/api/projects")
        response.raise_for_status()
        return response.json()["projects"]
    
    async def get_item_sets(
        self, 
        project_id: int,
        date_from: Optional[str] = None,
        date_to: Optional[str] = None
    ) -> List[dict]:
        """Получить список звонков проекта"""
        params = {}
        if date_from:
            params["date_from"] = date_from
        if date_to:
            params["date_to"] = date_to
        
        response = await self.client.get(
            f"/api/client/project/{project_id}/item-sets/by-date",
            params=params
        )
        response.raise_for_status()
        return response.json()["item_sets"]
    
    async def get_insights(
        self, 
        project_id: int, 
        item_set_id: int
    ) -> List[dict]:
        """Получить результаты анализа критериев"""
        response = await self.client.get(
            "/api/insights",
            params={
                "id_project": project_id,
                "id_item_set": item_set_id
            }
        )
        response.raise_for_status()
        return response.json()["insights"]
    
    async def get_transcription(
        self, 
        project_id: int, 
        item_set_id: int
    ) -> dict:
        """Получить транскрипцию"""
        response = await self.client.get(
            "/api/transcription",
            params={
                "id_project": project_id,
                "id_item_set": item_set_id
            }
        )
        response.raise_for_status()
        return response.json()["transcription"]
    
    async def get_crm_data(self, item_set_id: int) -> dict:
        """Получить CRM данные звонка"""
        response = await self.client.get(
            f"/api/client/item-set/{item_set_id}/crm-data"
        )
        response.raise_for_status()
        return response.json()["crm_data"]
    
    async def close(self):
        await self.client.aclose()
```

### 4. Sync Service

**Файл: `backend/app/integrations/nakama/sync.py`**

```python
class NakamaSyncService:
    """Сервис синхронизации данных из nakama"""
    
    def __init__(self, client: NakamaAPIClient, db: AsyncSession):
        self.client = client
        self.db = db
    
    async def sync_project(
        self, 
        local_project_id: int,
        nakama_project_id: int,
        since: datetime = None
    ) -> SyncResult:
        """
        Синхронизирует звонки из nakama в локальную БД.
        
        1. Получает список звонков из nakama
        2. Фильтрует только новые (status_within_project == 'processed')
        3. Для каждого нового звонка:
           - Загружает insights (критерии)
           - Загружает CRM данные
           - Сохраняет в локальную БД
        """
        # Получаем звонки
        item_sets = await self.client.get_item_sets(
            project_id=nakama_project_id,
            date_from=since.isoformat() if since else None
        )
        
        synced = 0
        errors = []
        
        for item_set in item_sets:
            if item_set["status_within_project"] != "processed":
                continue
            
            try:
                await self._sync_call(local_project_id, nakama_project_id, item_set)
                synced += 1
            except Exception as e:
                errors.append(SyncError(item_set_id=item_set["id"], error=str(e)))
        
        return SyncResult(synced=synced, errors=errors)
    
    async def _sync_call(
        self, 
        local_project_id: int,
        nakama_project_id: int,
        item_set: dict
    ):
        """Синхронизирует один звонок"""
        # Проверяем, существует ли уже
        existing = await self.db.execute(
            select(Call).where(
                Call.project_id == local_project_id,
                Call.external_id == str(item_set["id"])
            )
        )
        if existing.scalar():
            return  # Уже синхронизирован
        
        # Загружаем данные
        insights = await self.client.get_insights(nakama_project_id, item_set["id"])
        crm_data = await self.client.get_crm_data(item_set["id"])
        
        # Создаём звонок
        call = Call(
            project_id=local_project_id,
            external_id=str(item_set["id"]),
            call_date=self._parse_date(crm_data.get("call_date")),
            call_week=crm_data.get("week_of_the_call"),
            duration_seconds=int(crm_data.get("file_duration", 0)),
            metadata=crm_data
        )
        
        # Находим или создаём менеджера
        manager_name = crm_data.get("manager_name") or crm_data.get("Ответственный")
        if manager_name:
            call.manager = await self._get_or_create_manager(local_project_id, manager_name)
        
        self.db.add(call)
        await self.db.flush()
        
        # Добавляем оценки
        for insight in insights:
            criteria = await self._find_criteria(local_project_id, insight["criterion_name"])
            if criteria:
                score = CallScore(
                    call_id=call.id,
                    criteria_id=criteria.id,
                    score=str(insight.get("score", "")),
                    reason=insight.get("reasons", ""),
                    quote=insight.get("quotes", "")
                )
                self.db.add(score)
        
        await self.db.commit()
```

### 5. Celery Tasks

**Файл: `backend/app/tasks/sync_tasks.py`**

```python
from celery import Celery
from celery.schedules import crontab

celery = Celery('spellit')

@celery.task
def sync_all_projects():
    """
    Синхронизирует все активные проекты с nakama.
    Запускается по расписанию (каждые 5 минут).
    """
    pass

@celery.task
def sync_project(project_id: int):
    """Синхронизирует конкретный проект"""
    pass

@celery.task
def process_excel_upload(file_path: str, project_id: int):
    """
    Обрабатывает загруженный Excel файл.
    Запускается после загрузки через админку.
    """
    pass

# Расписание
celery.conf.beat_schedule = {
    'sync-every-5-minutes': {
        'task': 'app.tasks.sync_tasks.sync_all_projects',
        'schedule': crontab(minute='*/5'),
    },
}
```

### 6. Upload Service

**Файл: `backend/app/services/upload.py`**

```python
class UploadService:
    """Сервис загрузки Excel файлов"""
    
    async def process_upload(
        self, 
        file: UploadFile, 
        project_id: int
    ) -> UploadResult:
        """
        Обрабатывает загруженный Excel файл.
        
        1. Сохраняет файл во временную директорию
        2. Парсит лист Criteria
        3. Создаёт/обновляет критерии в БД
        4. Парсит лист AI
        5. Создаёт звонки и оценки в БД
        """
        # Сохраняем файл
        temp_path = await self._save_temp_file(file)
        
        try:
            # Парсим критерии
            criteria_parser = CriteriaSheetParser()
            parsed_criteria = criteria_parser.parse(temp_path)
            
            # Сохраняем критерии
            await self._save_criteria(project_id, parsed_criteria)
            
            # Получаем критерии из БД
            criteria = await self._get_project_criteria(project_id)
            
            # Парсим звонки
            ai_parser = AISheetParser()
            parsed_calls = ai_parser.parse(temp_path, criteria)
            
            # Сохраняем звонки
            saved = await self._save_calls(project_id, parsed_calls)
            
            return UploadResult(
                criteria_count=len(parsed_criteria.criteria),
                calls_count=saved,
                success=True
            )
        finally:
            # Удаляем временный файл
            os.remove(temp_path)
```

## Критерии готовности
- [ ] Excel парсер корректно читает Criteria
- [ ] Excel парсер корректно читает AI лист
- [ ] nakama клиент подключается и получает данные
- [ ] Синхронизация работает
- [ ] Celery задачи запускаются
- [ ] Загрузка Excel через API работает

## Зависимости от других агентов
- Agent 1: Модели БД для сохранения
- Agent 4: Использует данные для аналитики
