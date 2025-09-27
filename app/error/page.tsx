import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="w-full max-w-md">
        <div className="bg-background rounded-lg shadow-lg p-8 border text-center space-y-4">
          <h1 className="text-xl font-semibold text-destructive">
            오류가 발생했습니다
          </h1>
          <p className="text-sm text-muted-foreground">
            인증 링크가 유효하지 않거나 만료되었습니다. 다시 시도해주세요.
          </p>
          <Link href="/forgot-password">
            <Button className="w-full">
              비밀번호 재설정 다시 요청
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}