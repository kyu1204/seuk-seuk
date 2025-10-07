"use client";

import { useLanguage } from "@/contexts/language-context";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function TermPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("term.backToHome")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">{t("term.title")}</h1>

          <p className="text-muted-foreground mb-8">{t("term.intro")}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter1.title")}
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article1.title")}
            </h3>
            <p className="mb-4">{t("term.article1.content")}</p>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article2.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article2.item1")}</li>
              <li>{t("term.article2.item2")}</li>
              <li>{t("term.article2.item3")}</li>
              <li>{t("term.article2.item4")}</li>
              <li>{t("term.article2.item5")}</li>
              <li>{t("term.article2.item6")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article3.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article3.para1")}</li>
              <li>{t("term.article3.para2")}</li>
              <li>{t("term.article3.para3")}</li>
              <li>{t("term.article3.para4")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article4.title")}
            </h3>
            <p className="mb-4">{t("term.article4.content")}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter2.title")}
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article5.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article5.para1")}</li>
              <li>{t("term.article5.para2")}</li>
              <li>
                {t("term.article5.para3")}
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>{t("term.article5.para3.item1")}</li>
                  <li>{t("term.article5.para3.item2")}</li>
                  <li>{t("term.article5.para3.item3")}</li>
                  <li>{t("term.article5.para3.item4")}</li>
                </ul>
              </li>
              <li>{t("term.article5.para4")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article6.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article6.para1")}</li>
              <li>{t("term.article6.para2")}</li>
              <li>{t("term.article6.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article7.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article7.para1")}</li>
              <li>{t("term.article7.para2")}</li>
              <li>{t("term.article7.para3")}</li>
              <li>{t("term.article7.para4")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article8.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article8.para1")}</li>
              <li>{t("term.article8.para2")}</li>
              <li>{t("term.article8.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article9.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article9.para1")}</li>
              <li>{t("term.article9.para2")}</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter3.title")}
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article10.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article10.para1")}</li>
              <li>{t("term.article10.para2")}</li>
              <li>{t("term.article10.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article11.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article11.para1")}</li>
              <li>{t("term.article11.para2")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article12.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article12.para1")}</li>
              <li>{t("term.article12.para2")}</li>
              <li>{t("term.article12.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article13.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article13.para1")}</li>
              <li>{t("term.article13.para2")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article14.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article14.para1")}</li>
              <li>{t("term.article14.para2")}</li>
              <li>{t("term.article14.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article15.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>
                {t("term.article15.para1")}
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>{t("term.article15.para1.item1")}</li>
                  <li>{t("term.article15.para1.item2")}</li>
                  <li>{t("term.article15.para1.item3")}</li>
                  <li>{t("term.article15.para1.item4")}</li>
                  <li>{t("term.article15.para1.item5")}</li>
                </ul>
              </li>
              <li>{t("term.article15.para2")}</li>
              <li>{t("term.article15.para3")}</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter4.title")}
            </h2>
            <p className="mb-4">{t("term.chapter4.intro")}</p>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article16.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article16.para1")}</li>
              <li>{t("term.article16.para2")}</li>
              <li>{t("term.article16.para3")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article17.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article17.para1")}</li>
              <li>{t("term.article17.para2")}</li>
              <li>{t("term.article17.para3")}</li>
              <li>{t("term.article17.para4")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article18.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article18.para1")}</li>
              <li>{t("term.article18.para2")}</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter5.title")}
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article19.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article19.para1")}</li>
              <li>{t("term.article19.para2")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article20.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article20.para1")}</li>
              <li>{t("term.article20.para2")}</li>
              <li>{t("term.article20.para3")}</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("term.chapter6.title")}
            </h2>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article21.title")}
            </h3>
            <ol className="list-decimal pl-6 space-y-2 mb-4">
              <li>{t("term.article21.para1")}</li>
              <li>{t("term.article21.para2")}</li>
            </ol>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article22.title")}
            </h3>
            <p className="mb-4">{t("term.article22.content")}</p>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article23.title")}
            </h3>
            <p className="mb-4">{t("term.article23.content")}</p>

            <h3 className="text-xl font-semibold mb-3">
              {t("term.article24.title")}
            </h3>
            <p className="mb-4">{t("term.article24.content")}</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">
              {t("term.effectiveDate.title")}
            </h3>
            <p>{t("term.effectiveDate.date")}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
