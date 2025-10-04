import dayjs from "dayjs";
import "dayjs/locale/ko";

export type SupportedLanguage = "ko" | "en";

export function formatDateByLang(
  value: string | Date,
  type: "date" | "datetime",
  language: SupportedLanguage
): string {
  const locale = language === "ko" ? "ko" : "en";
  const pattern =
    language === "ko"
      ? type === "date"
        ? "YYYY.MM.DD"
        : "YYYY.MM.DD A h:mm"
      : type === "date"
      ? "MMM DD, YYYY"
      : "MMM DD, YYYY [at] h:mma";

  return dayjs(value).locale(locale).format(pattern);
}

