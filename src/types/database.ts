
export interface Database {
  profiles: {
    id: string;
    created_at: string;
    updated_at: string;
    full_name: string | null;
    phone_number: string | null;
    preferred_language: string | null;
    avatar_url: string | null;
    notification_preferences: {
      email: boolean;
      push: boolean;
      sms: boolean;
    } | null;
    theme: 'light' | 'dark' | null;
  };
  
  scans: {
    id: string;
    user_id: string;
    image_url: string;
    disease_name: string | null;
    confidence: number | null;
    affected_area_estimate: string | null;
    treatment_tips: string | null;
    prevention_tips: string | null;
    created_at: string;
  };
  
  weather_logs: {
    id: string;
    user_id: string;
    location: string;
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    precipitation: number | null;
    wind_speed: number | null;
    weather_condition: string | null;
    recommendation: string | null;
    created_at: string;
  };
  
  ai_chats: {
    id: string;
    user_id: string;
    user_message: string;
    ai_response: string;
    created_at: string;
  };
}
