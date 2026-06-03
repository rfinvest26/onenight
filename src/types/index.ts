export interface Model {
  id: number;
  user_id: number;
  name: string;
  age: number;
  country: string;
  city: string;
  description: string;
  services: string[];
  price_per_hour: number;
  photo_urls: string[];
  code: string;
  display_city?: string;
}

export interface SupportThread {
  id: number;
  user_id: number;
  topic: string;
  status: string;
  created_at: string;
}
