
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "./use-toast";

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
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Function to fetch dashboard data that can be called multiple times
  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
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
      setError(error instanceof Error ? error : new Error("Failed to fetch dashboard data"));
      
      // Only show toast on first error, not on repeated failures
      if (!error) {
        toast({
          title: "Dashboard data error",
          description: "Could not load your dashboard data. Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Set up real-time subscriptions to tables
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    // Initial fetch
    fetchDashboardData();

    // Set up real-time listeners for each table
    const scanChannel = supabase
      .channel('scans-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scans', filter: `user_id=eq.${user.id}` }, 
        () => {
          if (mounted) {
            console.log('Scans table changed, refreshing dashboard data');
            fetchDashboardData();
          }
        })
      .subscribe();

    const weatherChannel = supabase
      .channel('weather-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'weather_logs', filter: `user_id=eq.${user.id}` }, 
        () => {
          if (mounted) {
            console.log('Weather logs table changed, refreshing dashboard data');
            fetchDashboardData();
          }
        })
      .subscribe();

    const chatsChannel = supabase
      .channel('chats-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_chats', filter: `user_id=eq.${user.id}` }, 
        () => {
          if (mounted) {
            console.log('AI chats table changed, refreshing dashboard data');
            fetchDashboardData();
          }
        })
      .subscribe();

    // Clean up subscriptions
    return () => {
      mounted = false;
      supabase.removeChannel(scanChannel);
      supabase.removeChannel(weatherChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [user, fetchDashboardData]);

  return { dashboardData, isLoading, refreshDashboard: fetchDashboardData, error };
}
