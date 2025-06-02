
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
      console.log("Fetching dashboard data for user:", user.id);
      
      // Fetch all data in parallel for better performance
      const [scansResult, diseasesResult, weatherResult, chatsResult] = await Promise.all([
        // Total scans count
        supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // Diseases detected (scans with a disease name)
        supabase
          .from('scans')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .not('disease_name', 'is', null),
        
        // Weather alerts count
        supabase
          .from('weather_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        
        // AI chats count
        supabase
          .from('ai_chats')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
      ]);

      // Check for errors in any of the queries
      if (scansResult.error) {
        console.error("Error fetching scans:", scansResult.error);
        throw scansResult.error;
      }
      if (diseasesResult.error) {
        console.error("Error fetching diseases:", diseasesResult.error);
        throw diseasesResult.error;
      }
      if (weatherResult.error) {
        console.error("Error fetching weather logs:", weatherResult.error);
        throw weatherResult.error;
      }
      if (chatsResult.error) {
        console.error("Error fetching AI chats:", chatsResult.error);
        throw chatsResult.error;
      }
      
      const newData = {
        totalScans: scansResult.count || 0,
        diseasesDetected: diseasesResult.count || 0,
        weatherAlerts: weatherResult.count || 0,
        aiChats: chatsResult.count || 0
      };

      console.log("Dashboard data fetched:", newData);
      setDashboardData(newData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError(error instanceof Error ? error : new Error("Failed to fetch dashboard data"));
      
      toast({
        title: "Dashboard data error",
        description: "Could not load your dashboard data. Please try again later.",
        variant: "destructive"
      });
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

    console.log("Setting up real-time subscriptions for user:", user.id);

    // Set up real-time listeners for each table with more specific channel names
    const scanChannel = supabase
      .channel(`scans-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'scans', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('Scans table changed:', payload);
            fetchDashboardData();
          }
        })
      .subscribe((status) => {
        console.log('Scans channel subscription status:', status);
      });

    const weatherChannel = supabase
      .channel(`weather-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'weather_logs', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('Weather logs table changed:', payload);
            fetchDashboardData();
          }
        })
      .subscribe((status) => {
        console.log('Weather channel subscription status:', status);
      });

    const chatsChannel = supabase
      .channel(`chats-${user.id}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'ai_chats', filter: `user_id=eq.${user.id}` }, 
        (payload) => {
          if (mounted) {
            console.log('AI chats table changed:', payload);
            fetchDashboardData();
          }
        })
      .subscribe((status) => {
        console.log('Chats channel subscription status:', status);
      });

    // Clean up subscriptions
    return () => {
      mounted = false;
      console.log("Cleaning up dashboard subscriptions");
      supabase.removeChannel(scanChannel);
      supabase.removeChannel(weatherChannel);
      supabase.removeChannel(chatsChannel);
    };
  }, [user, fetchDashboardData]);

  return { dashboardData, isLoading, refreshDashboard: fetchDashboardData, error };
}
