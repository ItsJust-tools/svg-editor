import { JsonLd } from "./json-ld";
import toolConfig from "@/tool/tool.config";
import ToolClient from "./tool-client-wrapper";

export default function ToolPage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 flex flex-col min-h-0 outline-none"
    >
      <JsonLd config={toolConfig} />
      <ToolClient />
    </main>
  );
}
