import { performSignOut } from "@/app/actions/auth-actions"

export default async function LogoutPage() {
  // SSR에서 즉시 로그아웃 처리
  await performSignOut()

  // 이 코드는 실행되지 않지만, TypeScript를 위한 fallback
  return null
}