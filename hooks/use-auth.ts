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
    setState((prev) => ({ ...prev, mounted: true }));

    // 현재 사용자 상태 가져오기
    // 화면 표시(사용자 이름/아바타 등)용으로만 사용하며 인가 판단에는 쓰지 않는다.
    // getUser()는 매번 네트워크 왕복이 발생하므로, 로컬 세션을 읽는
    // getSession()으로 초기 표시를 빠르게 처리한다. 실제 인증 보장은 미들웨어가 담당.
    const getInitialUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setState((prev) => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
          signingOut: false,
        }));
      } catch (error) {
        console.error("Error fetching session:", error);
        setState((prev) => ({
          ...prev,
          user: null,
          loading: false,
          signingOut: false,
        }));
      }
    };

    getInitialUser();

    // 인증 상태 변화 실시간 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setState((prev) => ({
        ...prev,
        user: session?.user ?? null,
        loading: false,
        signingOut: false,
      }));
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signOut = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      await supabase.auth.signOut();
      // 상태는 onAuthStateChange에서 자동으로 업데이트됨
    } catch (error) {
      console.error("Error signing out:", error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    user: state.user,
    loading: state.loading || !state.mounted, // mounted 되지 않은 경우도 loading으로 처리
    isAuthenticated: !!state.user,
    signOut,
  };
}
