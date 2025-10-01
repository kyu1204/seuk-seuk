"use client";

import { useLanguage } from "@/contexts/language-context";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("privacy.backToHome")}
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6">{t("privacy.title")}</h1>

          <p className="text-muted-foreground mb-8">{t("privacy.intro")}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section1.title")}
            </h2>
            <p className="mb-4">{t("privacy.section1.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section1.item1.title")}:</strong>{" "}
                {t("privacy.section1.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section1.item2.title")}:</strong>{" "}
                {t("privacy.section1.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section1.item3.title")}:</strong>{" "}
                {t("privacy.section1.item3.content")}
              </li>
              <li>
                <strong>{t("privacy.section1.item4.title")}:</strong>{" "}
                {t("privacy.section1.item4.content")}
              </li>
              <li>
                <strong>{t("privacy.section1.item5.title")}:</strong>{" "}
                {t("privacy.section1.item5.content")}
              </li>
              <li>
                <strong>{t("privacy.section1.item6.title")}:</strong>{" "}
                {t("privacy.section1.item6.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section2.title")}
            </h2>
            <p className="mb-4">{t("privacy.section2.intro")}</p>

            <h3 className="text-xl font-semibold mb-3">
              {t("privacy.section2.sub1.title")}
            </h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                <strong>{t("privacy.section2.sub1.required")}:</strong>{" "}
                {t("privacy.section2.sub1.requiredItems")}
              </li>
              <li>
                <strong>{t("privacy.section2.sub1.optional")}:</strong>{" "}
                {t("privacy.section2.sub1.optionalItems")}
              </li>
              <li>
                <strong>{t("privacy.section2.sub1.social")}:</strong>{" "}
                {t("privacy.section2.sub1.socialItems")}
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">
              {t("privacy.section2.sub2.title")}
            </h3>
            <ul className="list-disc pl-6 mb-4 space-y-1">
              <li>
                <strong>{t("privacy.section2.sub2.signature")}:</strong>{" "}
                {t("privacy.section2.sub2.signatureContent")}
              </li>
              <li>
                <strong>{t("privacy.section2.sub2.document")}:</strong>{" "}
                {t("privacy.section2.sub2.documentContent")}
              </li>
              <li>
                <strong>{t("privacy.section2.sub2.recipient")}:</strong>{" "}
                {t("privacy.section2.sub2.recipientContent")}
              </li>
              <li>
                <strong>{t("privacy.section2.sub2.payment")}:</strong>{" "}
                {t("privacy.section2.sub2.paymentContent")}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section3.title")}
            </h2>
            <p className="mb-4">{t("privacy.section3.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section3.item1.title")}:</strong>{" "}
                {t("privacy.section3.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section3.item2.title")}:</strong>{" "}
                {t("privacy.section3.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section3.item3.title")}:</strong>{" "}
                {t("privacy.section3.item3.content")}
              </li>
              <li>
                <strong>{t("privacy.section3.item4.title")}:</strong>{" "}
                {t("privacy.section3.item4.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section4.title")}
            </h2>
            <p className="mb-4">{t("privacy.section4.content")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section4.social")}:</strong>{" "}
                {t("privacy.section4.socialContent")}
              </li>
              <li>
                <strong>{t("privacy.section4.legal")}:</strong>{" "}
                {t("privacy.section4.legalContent")}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section5.title")}
            </h2>
            <p className="mb-4">{t("privacy.section5.intro")}</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                      {t("privacy.section5.table.header1")}
                    </th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                      {t("privacy.section5.table.header2")}
                    </th>
                    <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                      {t("privacy.section5.table.header3")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row1.col1")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row1.col2")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row1.col3")}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row2.col1")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row2.col2")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row2.col3")}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row3.col1")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row3.col2")}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                      {t("privacy.section5.table.row3.col3")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">{t("privacy.section5.outro")}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section6.title")}
            </h2>
            <p className="mb-4">{t("privacy.section6.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section6.item1.title")}:</strong>{" "}
                {t("privacy.section6.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section6.item2.title")}:</strong>{" "}
                {t("privacy.section6.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section6.item3.title")}:</strong>{" "}
                {t("privacy.section6.item3.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section7.title")}
            </h2>
            <p className="mb-4">{t("privacy.section7.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section7.item1.title")}:</strong>{" "}
                {t("privacy.section7.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section7.item2.title")}:</strong>{" "}
                {t("privacy.section7.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section7.item3.title")}:</strong>{" "}
                {t("privacy.section7.item3.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section8.title")}
            </h2>
            <p className="mb-4">{t("privacy.section8.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section8.item1.title")}:</strong>{" "}
                {t("privacy.section8.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section8.item2.title")}:</strong>{" "}
                {t("privacy.section8.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section8.item3.title")}:</strong>{" "}
                {t("privacy.section8.item3.content")}
              </li>
              <li>
                <strong>{t("privacy.section8.item4.title")}:</strong>{" "}
                {t("privacy.section8.item4.content")}
              </li>
              <li>
                <strong>{t("privacy.section8.item5.title")}:</strong>{" "}
                {t("privacy.section8.item5.content")}
              </li>
              <li>
                <strong>{t("privacy.section8.item6.title")}:</strong>{" "}
                {t("privacy.section8.item6.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section9.title")}
            </h2>
            <p className="mb-4">{t("privacy.section9.intro")}</p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section9.item1.title")}:</strong>{" "}
                {t("privacy.section9.item1.content")}
              </li>
              <li>
                <strong>{t("privacy.section9.item2.title")}:</strong>{" "}
                {t("privacy.section9.item2.content")}
              </li>
              <li>
                <strong>{t("privacy.section9.item3.title")}:</strong>{" "}
                {t("privacy.section9.item3.content")}
              </li>
              <li>
                <strong>{t("privacy.section9.item4.title")}:</strong>{" "}
                {t("privacy.section9.item4.content")}
              </li>
              <li>
                <strong>{t("privacy.section9.item5.title")}:</strong>{" "}
                {t("privacy.section9.item5.content")}
              </li>
              <li>
                <strong>{t("privacy.section9.item6.title")}:</strong>{" "}
                {t("privacy.section9.item6.content")}
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section10.title")}
            </h2>
            <p className="mb-4">{t("privacy.section10.intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section10.responsibility")}:</strong>{" "}
                {t("privacy.section10.responsibilityName")}
              </li>
              <li>
                <strong>{t("privacy.section10.contact")}:</strong>{" "}
                <a
                  href="mailto:pb1123love@gmail.com"
                  className="text-primary hover:underline"
                >
                  pb1123love@gmail.com
                </a>
              </li>
              <li>
                <strong>{t("privacy.section10.duties")}:</strong>{" "}
                {t("privacy.section10.dutiesContent")}
              </li>
            </ul>
            <p className="mt-4">{t("privacy.section10.outro")}</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section11.title")}
            </h2>
            <p className="mb-4">{t("privacy.section11.intro")}</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>{t("privacy.section11.item1.title")}:</strong>{" "}
                <a
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  privacy.kisa.or.kr
                </a>
                , ☎ {t("privacy.section11.item1.phone")}
              </li>
              <li>
                <strong>{t("privacy.section11.item2.title")}:</strong>{" "}
                <a
                  href="https://www.kopico.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.kopico.go.kr
                </a>
                , ☎ {t("privacy.section11.item2.phone")}
              </li>
              <li>
                <strong>{t("privacy.section11.item3.title")}:</strong>{" "}
                <a
                  href="https://www.spo.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.spo.go.kr
                </a>
                , ☎ {t("privacy.section11.item3.phone")}
              </li>
              <li>
                <strong>{t("privacy.section11.item4.title")}:</strong>{" "}
                <a
                  href="https://cyberbureau.police.go.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  cyberbureau.police.go.kr
                </a>
                , ☎ {t("privacy.section11.item4.phone")}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.section12.title")}
            </h2>
            <p className="mb-4">{t("privacy.section12.content")}</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xl font-semibold mb-3">
              {t("privacy.effectiveDate.title")}
            </h3>
            <p>{t("privacy.effectiveDate.date")}</p>
          </section>
        </div>
      </main>
    </div>
  );
}
