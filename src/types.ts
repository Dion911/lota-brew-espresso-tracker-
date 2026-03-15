export interface Shot {
  id: string;
  bean_name: string;
  roaster: string;
  bean_type: string;
  roast_level: string;
  grind_setting: string;
  dose: number;
  yield: number;
  time: number;
  rating: 'Great' | 'Good' | 'Okay' | 'Off' | 'Bad';
  notes: string;
  machine: string;
  grinder: string;
  brew_method?: string;
  photo_url?: string;
  created_at: string;
}

export interface Stats {
  total_shots: number;
  avg_rating: number;
}

export interface WeeklyData {
  day: string;
  count: number;
  avg_time: number;
}

export interface RatingDistribution {
  rating: string;
  count: number;
}
