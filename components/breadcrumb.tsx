"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLanguage } from "@/contexts/language-context";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function ProjectBreadcrumb() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Generate breadcrumb items based on current path
  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: t("breadcrumb.dashboard"),
        href: "/dashboard",
      },
    ];

    // Upload page
    if (pathname === "/upload") {
      items.push({
        label: t("breadcrumb.upload"),
      });
    }

    // Document details page
    else if (pathname.startsWith("/document/")) {
      items.push({
        label: t("breadcrumb.details"),
      });
    }

    return items;
  };

  const items = getBreadcrumbItems();

  // Don't show breadcrumb on dashboard page (only one item)
  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {item.href ? (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < items.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}