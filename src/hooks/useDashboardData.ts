
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export interface DashboardData {
  totalScans: number;
  diseasesDetected: number;
  weatherAlerts: number;
  aiChats: number;
}

export function useDashboardData(user: User | null) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalScans: 0,
    diseasesDetected: 0,
    weatherAlerts: 0,
    aiChats: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch dashboard data that can be called multiple times
  const fetchDashboardData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      // Fetch total scans count
      const { count: scansCount, error: scansError } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (scansError) throw scansError;
      
      // Fetch diseases detected (scans with a disease name)
      const { count: diseasesCount, error: diseasesError } = await supabase
        .from('scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .not('disease_name', 'is', null);
      
      if (diseasesError) throw diseasesError;
      
      // Fetch weather logs count
      const { count: weatherCount, error: weatherError } = await supabase
        .from('weather_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (weatherError) throw weatherError;
      
      // Fetch AI chats count
      const { count: chatsCount, error: chatsError } = await supabase
        .from('ai_chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (chatsError) throw chatsError;
      
      setDashboardData({
        totalScans: scansCount || 0,
        diseasesDetected: diseasesCount || 0,
        weatherAlerts: weatherCount || 0,
        aiChats: chatsCount || 0
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Set default values if there's an error
      setDashboardData({
        totalScans: 0,
        diseasesDetected: 0,
        weatherAlerts: 0,
        aiChats: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up real-time subscriptions to tables
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    // Initial fetch
    fetchDashboardData();

    // Set up real-time listeners for each table
    const scanChannel = supabase
      .channel('scans-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scans', filter: `user_id=eq.${user.id}` }, 
        () => {
          console.log('Scans table changed, refreshing dashboard data');
          fetchDashboardData();
        })
      .subscribe();

    const weatherChannel = supabase
      .channel('weather-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'weather_logs', filter: `user_id=eq.${user.id}` }, 
        () => {
          console.log('Weather logs table changed, refreshing dashboard data');
          fetchDashboardData();
        })
      .subscribe();

    const chatsChannel = supabase
      .channel('chats-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_chats', filter: `user_id=eq.${user.id}` }, 
        () => {
          console.log('AI chats table changed, refreshing dashboard data');
          fetchDashboardData();
        })
      .subscribe();

    // Clean up subscriptions
    return () => {
      supabase.removeChannel(scanChannel);
      supabase.removeChannel(weatherChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [user]);

  return { dashboardData, isLoading, refreshDashboard: fetchDashboardData };
}
