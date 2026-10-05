"use client";

import { EditableFilePanel } from "./editable-file-panel";

const defaultPrompt = "It is necessary to produce a \"2026 Q2 E-commerce Operations Work Report\" PPT, which will be used for the company's management quarterly meeting report. The overall number of pages should be controlled within 8 pages, and the style will be more business-tech. Focus on reflecting sales growth, user growth, advertising effects and 618 activity results, and present them through line charts, bar charts, donut charts, and funnel charts.";

export function PptPanel() {
  return <EditableFilePanel title="PPT generation" kind="ppt" endpoint="/v1/ppt/generations" defaultPrompt={defaultPrompt} />;
}
