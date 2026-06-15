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
    const items: BreadcrumbItem[] = [];

    // Check if it's a sign page (external users)
    const isSignPage = pathname.startsWith("/sign/");

    // Add first item based on context
    if (!isSignPage) {
      // Internal pages - use Dashboard as root
      items.push({
        label: t("breadcrumb.dashboard"),
        href: "/dashboard",
      });
    }

    // Upload page
    if (pathname === "/upload") {
      items.push({
        label: t("breadcrumb.upload"),
      });
    }

    // Publish page
    else if (pathname === "/publish") {
      items.push({
        label: t("breadcrumb.publish"),
      });
    }

    // Publication detail page
    else if (pathname.startsWith("/publication/")) {
      items.push({
        label: t("breadcrumb.publicationDetail"),
      });
    }

    // Document details page
    else if (pathname.startsWith("/document/")) {
      items.push({
        label: t("breadcrumb.details"),
      });
    }

    // Sign document page (individual document signing)
    else if (pathname.match(/^\/sign\/[^/]+\/document\/[^/]+/)) {
      // Extract publication ID from pathname
      const parts = pathname.split("/");
      const publicationId = parts[2];

      items.push({
        label: t("breadcrumb.sign"),
        href: `/sign/${publicationId}`,
      });

      items.push({
        label: t("breadcrumb.signDocument"),
      });
    }

    // Sign list page - no breadcrumb needed (only one level)

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