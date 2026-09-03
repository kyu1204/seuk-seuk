export function deriveSenderName(
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null,
  profile?: { name?: string | null } | null
): string {
  // 사용자가 마이페이지에서 직접 정한 이름이 최우선. 소셜 로그인 닉네임보다 앞선다.
  const profileName = profile?.name;
  if (typeof profileName === "string" && profileName.trim()) return profileName.trim();

  if (!user) return "";

  const fullName = user.user_metadata?.full_name;
  if (typeof fullName === "string" && fullName.trim()) return fullName;

  const name = user.user_metadata?.name;
  if (typeof name === "string" && name.trim()) return name;

  if (user.email) {
    const local = user.email.split("@")[0];
    if (local) return local;
  }

  return "";
}
