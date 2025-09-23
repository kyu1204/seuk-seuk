"use client";

import { createClientSupabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

interface AuthState {
  user: User | null;
  loading: boolean;
  signingOut: boolean;
  mounted: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    signingOut: false,
    mounted: false,
  });

  const supabase = createClientSupabase();

  useEffect(() => {
    // mounted 상태를 true로 설정 (hydration 완료)
    setState(prev => ({ ...prev, mounted: true }));

    // 현재 사용자 상태 가져오기
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setState(prev => ({ ...prev, user, loading: false, signingOut: false }));
      } catch (error) {
        console.error("Error fetching user:", error);
        setState(prev => ({ ...prev, user: null, loading: false, signingOut: false }));
      }
    };

    getUser();

    // 인증 상태 변화 실시간 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState(prev => ({ ...prev, user: session?.user ?? null, loading: false, signingOut: false }));
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      // 상태는 onAuthStateChange에서 자동으로 업데이트됨
    } catch (error) {
      console.error("Error signing out:", error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  return {
    user: state.user,
    loading: state.loading || !state.mounted, // mounted 되지 않은 경우도 loading으로 처리
    isAuthenticated: !!state.user,
    signOut,
  };
}