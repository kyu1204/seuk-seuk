export function deriveSenderName(
  user: { email?: string | null; user_metadata?: Record<string, unknown> | null } | null
): string {
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
