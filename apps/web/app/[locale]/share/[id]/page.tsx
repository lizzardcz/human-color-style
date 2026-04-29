import { ReportViewerClient } from "@/components/report/ReportViewerClient";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export default async function LocalizedSharePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  return <ReportViewerClient id={id} mode="share" />;
}
