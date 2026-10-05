"use client";

import { EditableFilePanel } from "./editable-file-panel";

const defaultPrompt = "Split the poster elements according to the original image position and synthesize them into editable PSD, retain the background and the layer position of each element, and output each layer material zip at the same time.";

export function PsdPanel() {
  return <EditableFilePanel title="Tạo tệp PSD" kind="psd" endpoint="/v1/psd/generations" defaultPrompt={defaultPrompt} imageRequired />;
}
