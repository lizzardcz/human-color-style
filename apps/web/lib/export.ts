"use client";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export async function downloadNodeAsPng(node: HTMLElement, fileName: string, pixelRatio = 2) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio,
    backgroundColor: "#fbf6ed",
    canvasWidth: node.offsetWidth * pixelRatio,
    canvasHeight: node.offsetHeight * pixelRatio,
  });

  const link = document.createElement("a");
  link.download = fileName;
  link.href = dataUrl;
  link.click();
}

export async function downloadNodeAsPdf(node: HTMLElement, fileName: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#fbf6ed",
  });
  const pdf = new jsPDF({
    orientation: node.offsetWidth > node.offsetHeight ? "landscape" : "portrait",
    unit: "px",
    format: [node.offsetWidth, node.offsetHeight],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, node.offsetWidth, node.offsetHeight);
  pdf.save(fileName);
}
