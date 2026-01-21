import { 
  CallRecord, 
  ManagerStats, 
  CriteriaScore, 
  ChartDataPoint, 
  TeamCriteriaData,
  CoachingItem,
  GrowthArea 
} from "@/types";

// Mock Managers
export const mockManagers: ManagerStats[] = [
  { id: '1', name: 'Иванов Алексей', avatar: '', total_calls: 24, avg_score: 89.2, trend: 'up', change: 5.1, rank: 1 },
  { id: '2', name: 'Петров Владимир', avatar: '', total_calls: 31, avg_score: 85.7, trend: 'up', change: 2.3, rank: 2 },
  { id: '3', name: 'Сидорова Мария', avatar: '', total_calls: 18, avg_score: 82.1, trend: 'flat', change: 0.1, rank: 3 },
  { id: '4', name: 'Козлов Игорь', avatar: '', total_calls: 22, avg_score: 76.4, trend: 'down', change: -3.2, rank: 4 },
  { id: '5', name: 'Новикова Елена', avatar: '', total_calls: 27, avg_score: 74.8, trend: 'down', change: -1.5, rank: 5 },
  { id: '6', name: 'Смирнов Дмитрий', avatar: '', total_calls: 19, avg_score: 72.3, trend: 'up', change: 1.8, rank: 6 },
  { id: '7', name: 'Федорова Анна', avatar: '', total_calls: 15, avg_score: 68.9, trend: 'down', change: -4.2, rank: 7 },
  { id: '8', name: 'Морозов Сергей', avatar: '', total_calls: 21, avg_score: 65.1, trend: 'flat', change: 0.3, rank: 8 },
];

// Mock Criteria Names
export const criteriaNames = [
  'Приветствие',
  'Выявление потребностей',
  'Презентация',
  'Отработка возражений',
  'Закрытие сделки',
  'Дополнительные продажи',
];

// Mock Calls
export const mockCalls: CallRecord[] = [
  {
    id: '1',
    date: '2026-01-19T14:30:00',
    duration: 754, // seconds
    score: 92,
    manager_id: '1',
    manager_name: 'Иванов Алексей',
    client_name: 'ООО Рога и Копыта',
    criteria_scores: generateCriteriaScores(92),
  },
  {
    id: '2',
    date: '2026-01-18T10:15:00',
    duration: 482,
    score: 78,
    manager_id: '1',
    manager_name: 'Иванов Алексей',
    client_name: 'ИП Сидоров',
    criteria_scores: generateCriteriaScores(78),
  },
  {
    id: '3',
    date: '2026-01-18T16:45:00',
    duration: 623,
    score: 85,
    manager_id: '2',
    manager_name: 'Петров Владимир',
    client_name: 'ЗАО Альфа',
    criteria_scores: generateCriteriaScores(85),
  },
  {
    id: '4',
    date: '2026-01-17T11:00:00',
    duration: 891,
    score: 71,
    manager_id: '4',
    manager_name: 'Козлов Игорь',
    client_name: 'ООО Бета Групп',
    criteria_scores: generateCriteriaScores(71),
  },
  {
    id: '5',
    date: '2026-01-17T15:30:00',
    duration: 534,
    score: 88,
    manager_id: '3',
    manager_name: 'Сидорова Мария',
    client_name: 'АО Гамма',
    criteria_scores: generateCriteriaScores(88),
  },
  {
    id: '6',
    date: '2026-01-16T09:45:00',
    duration: 712,
    score: 65,
    manager_id: '5',
    manager_name: 'Новикова Елена',
    client_name: 'ИП Петрова',
    criteria_scores: generateCriteriaScores(65),
  },
];

function generateCriteriaScores(avgScore: number): CriteriaScore[] {
  return criteriaNames.map((name, index) => {
    const variance = (Math.random() - 0.5) * 30;
    const score = Math.max(1, Math.min(5, Math.round((avgScore / 20) + variance / 20)));
    return {
      id: `criteria-${index + 1}`,
      name,
      score,
      maxScore: 5,
      feedback: score < 4 ? getRandomFeedback(name) : undefined,
      quote: score < 4 ? getRandomQuote(name) : undefined,
    };
  });
}

function getRandomFeedback(criteria: string): string {
  const feedbacks: Record<string, string[]> = {
    'Приветствие': [
      'Не представился полностью',
      'Слишком быстрое приветствие',
      'Не уточнил имя клиента',
    ],
    'Выявление потребностей': [
      'Частично выявил потребности, не уточнил бюджет',
      'Не задал достаточно уточняющих вопросов',
      'Пропустил важные аспекты потребностей клиента',
    ],
    'Презентация': [
      'Не адаптировал презентацию под потребности',
      'Слишком техническое описание',
      'Не показал выгоды для клиента',
    ],
    'Отработка возражений': [
      'Не полностью отработал возражение о цене',
      'Прервал клиента при возражении',
      'Не использовал технику переформулирования',
    ],
    'Закрытие сделки': [
      'Не сделал чёткий призыв к действию',
      'Не зафиксировал следующий шаг',
      'Упустил момент для закрытия',
    ],
    'Дополнительные продажи': [
      'Не предложил сопутствующие товары',
      'Слишком навязчивое предложение',
      'Не учёл контекст основной покупки',
    ],
  };
  const options = feedbacks[criteria] || ['Требует улучшения'];
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomQuote(criteria: string): string {
  const quotes: Record<string, string[]> = {
    'Приветствие': [
      'Алло, слушаю вас',
      'Да, говорите',
    ],
    'Выявление потребностей': [
      'Какой продукт вас интересует?',
      'Что вам нужно?',
    ],
    'Презентация': [
      'У нас есть разные варианты...',
      'Это хороший продукт',
    ],
    'Отработка возражений': [
      'Ну, цена такая какая есть',
      'Можем дать скидку',
    ],
    'Закрытие сделки': [
      'Ну, подумайте и перезвоните',
      'Если что - звоните',
    ],
    'Дополнительные продажи': [
      'А ещё у нас есть...',
      'Может ещё что-то возьмёте?',
    ],
  };
  const options = quotes[criteria] || ['...'];
  return options[Math.floor(Math.random() * options.length)];
}

// Mock Quality Trend Data (last 8 weeks)
export const mockQualityTrend: ChartDataPoint[] = [
  { date: 'Нед 1', value: 72.3 },
  { date: 'Нед 2', value: 73.8 },
  { date: 'Нед 3', value: 71.5 },
  { date: 'Нед 4', value: 75.2 },
  { date: 'Нед 5', value: 76.8 },
  { date: 'Нед 6', value: 74.9 },
  { date: 'Нед 7', value: 77.4 },
  { date: 'Нед 8', value: 78.5 },
];

// Mock Top Issues (criteria with lowest average scores)
export const mockTopIssues = [
  { criteria: 'Выявление потребностей', avgScore: 68.2, count: 45 },
  { criteria: 'Отработка возражений', avgScore: 71.5, count: 38 },
  { criteria: 'Закрытие сделки', avgScore: 73.1, count: 32 },
  { criteria: 'Дополнительные продажи', avgScore: 74.8, count: 28 },
];

// Mock HeatMap Data (managers x criteria)
export const mockHeatMapData: TeamCriteriaData[] = mockManagers.slice(0, 6).map(manager => ({
  managerId: manager.id,
  managerName: manager.name.split(' ')[0],
  criteria: {
    'Приветствие': 70 + Math.random() * 25,
    'Потребности': 60 + Math.random() * 35,
    'Презентация': 65 + Math.random() * 30,
    'Возражения': 55 + Math.random() * 40,
    'Закрытие': 60 + Math.random() * 35,
    'Доп. продажи': 50 + Math.random() * 45,
  },
}));

// Mock Coaching Queue
export const mockCoachingQueue: CoachingItem[] = [
  { managerId: '4', managerName: 'Козлов Игорь', criteria: 'Отработка возражений', score: 58, priority: 'high' },
  { managerId: '5', managerName: 'Новикова Елена', criteria: 'Закрытие сделки', score: 62, priority: 'high' },
  { managerId: '6', managerName: 'Смирнов Дмитрий', criteria: 'Презентация', score: 65, priority: 'medium' },
  { managerId: '7', managerName: 'Федорова Анна', criteria: 'Выявление потребностей', score: 68, priority: 'medium' },
  { managerId: '8', managerName: 'Морозов Сергей', criteria: 'Приветствие', score: 71, priority: 'low' },
];

// Mock Growth Areas (for personal dashboard)
export const mockGrowthAreas: GrowthArea[] = [
  {
    criteriaId: '4',
    criteriaName: 'Отработка возражений',
    userScore: 65,
    teamAverage: 72,
    recommendation: 'Рекомендуется использовать технику SPIN для более эффективной работы с возражениями. Обратите внимание на эмпатию при ответе.',
  },
  {
    criteriaId: '6',
    criteriaName: 'Дополнительные продажи',
    userScore: 58,
    teamAverage: 68,
    recommendation: 'Попробуйте предлагать сопутствующие товары после основной продажи, связывая их с уже выявленными потребностями клиента.',
  },
];

// Mock Radar Data for personal profile
export const mockRadarData = criteriaNames.map(name => ({
  subject: name.length > 12 ? name.slice(0, 12) + '...' : name,
  user: 60 + Math.random() * 35,
  team: 65 + Math.random() * 25,
}));

// Mock personal trend data
export const mockPersonalTrend: ChartDataPoint[] = [
  { date: 'Пн', value: 85 },
  { date: 'Вт', value: 88 },
  { date: 'Ср', value: 82 },
  { date: 'Чт', value: 91 },
  { date: 'Пт', value: 89 },
  { date: 'Сб', value: 93 },
  { date: 'Вс', value: 90 },
];

// KPI Summary Data
export const mockKPISummary = {
  avgScore: 78.5,
  avgScoreChange: 3.2,
  totalCalls: 156,
  totalCallsChange: 12,
  totalDuration: 152100, // seconds (42h 15m)
  totalDurationChange: -7200, // -2h
  totalManagers: 8,
  managersChange: 0,
};

// Personal KPI Data
export const mockPersonalKPI = {
  myScore: 89.2,
  myScoreChange: 5.1,
  myCalls: 24,
  myCallsChange: 3,
  myRank: 1,
  totalManagers: 8,
  rankChange: 2,
  vsTeam: 10.7,
  vsTeamChange: 2.3,
};
