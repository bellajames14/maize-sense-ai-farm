
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

export function useEnhancedDashboardData(user: User | null) {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalScans: 0,
    diseasesDetected: 0,
    weatherAlerts: 0,
    aiChats: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchDashboardData = useCallback(async () => {
    if (!user) {
      setDashboardData({
        totalScans: 0,
        diseasesDetected: 0,
        weatherAlerts: 0,
        aiChats: 0
      });
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("Fetching enhanced dashboard data for user:", user.id);
      
      const [scansResult, diseasesResult, weatherResult, chatsResult] = await Promise.all([
        supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('disease_name', 'eq', 'Healthy')
          .not('disease_name', 'is', null),
        
        supabase
          .from('weather_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        supabase
          .from('ai_chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      if (scansResult.error) throw scansResult.error;
      if (diseasesResult.error) throw diseasesResult.error;
      if (weatherResult.error) throw weatherResult.error;
      if (chatsResult.error) throw chatsResult.error;
      
      const newData = {
        totalScans: scansResult.count || 0,
        diseasesDetected: diseasesResult.count || 0,
        weatherAlerts: weatherResult.count || 0,
        aiChats: chatsResult.count || 0
      };

      console.log("Enhanced dashboard data fetched:", newData);
      setDashboardData(newData);
    } catch (error) {
      console.error("Error fetching enhanced dashboard data:", error);
      setError(error instanceof Error ? error : new Error("Failed to fetch dashboard data"));
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Set up enhanced real-time subscriptions
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    let mounted = true;
    fetchDashboardData();

    console.log("Setting up enhanced real-time subscriptions for user:", user.id);

    // Create a single channel for all table changes
    const dashboardChannel = supabase
      .channel(`dashboard-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scans', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('Scans table changed:', payload);
            fetchDashboardData();
          }
        })
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'weather_logs', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('Weather logs table changed:', payload);
            fetchDashboardData();
          }
        })
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_chats', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('AI chats table changed:', payload);
            fetchDashboardData();
          }
        })
      .subscribe((status) => {
        console.log('Enhanced dashboard channel subscription status:', status);
        if (status === 'SUBSCRIBED') {
          toast({
            title: "Dashboard Connected",
            description: "Your dashboard will now update automatically",
          });
        }
      });

    return () => {
      mounted = false;
      console.log("Cleaning up enhanced dashboard subscriptions");
      supabase.removeChannel(dashboardChannel);
    };
  }, [user, fetchDashboardData, toast]);

  return { dashboardData, isLoading, refreshDashboard: fetchDashboardData, error };
}
