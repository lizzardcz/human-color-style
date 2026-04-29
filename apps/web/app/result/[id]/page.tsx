import { ReportViewerClient } from "@/components/report/ReportViewerClient";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportViewerClient id={id} mode="result" />;
}
