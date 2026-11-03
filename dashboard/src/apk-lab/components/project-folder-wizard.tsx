import { useState } from "react";
import {
  DesktopIcon,
  FileTextIcon,
  PlusIcon,
  TerminalWindowIcon,
  TrashIcon
} from "@phosphor-icons/react";

export interface ProjectFolder {
  id: string;
  name: string;
  icon?: "desktop" | "terminal" | "note" | "archive";
}

export interface ProjectFolderWizardProps {
  title?: string;
  subtitle?: string;
  folders?: ProjectFolder[];
  onSelectFolder?: (folderId: string) => void;
  onNewFolder?: () => void;
  className?: string;
}

const DEFAULT_FOLDERS: ProjectFolder[] = [
  { id: "f1", name: "KIMI", icon: "desktop" },
  { id: "f2", name: "KIMI", icon: "terminal" },
  { id: "f3", name: "KIMI", icon: "note" },
  { id: "f4", name: "KIMI", icon: "archive" }
];

export function ProjectFolderWizard({
  title = "New project",
  subtitle = "Keep one topic in one place",
  folders = DEFAULT_FOLDERS,
  onSelectFolder,
  onNewFolder,
  className = ""
}: ProjectFolderWizardProps) {
  const [selectedId, setSelectedId] = useState<string>("new");

  return (
    <div
      className={`apk-crosshair-box relative flex flex-col items-center justify-center rounded-2xl border border-(--iux-border) bg-[#090d14] py-14 px-6 text-center shadow-xl ${className}`}
    >
      <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
      <p className="mt-2 text-xs text-zinc-400">{subtitle}</p>

      {/* Perspective / Folder Stack Carousel */}
      <div className="mt-12 flex items-center justify-center gap-4 sm:gap-6 overflow-x-auto py-4 w-full">
        {/* Left Side Folders */}
        <button
          type="button"
          onClick={() => {
            setSelectedId(folders[0]?.id || "f1");
            onSelectFolder?.(folders[0]?.id || "f1");
          }}
          className={`group relative flex flex-col items-center justify-center w-28 h-24 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 shadow-md hover:opacity-100 transition-all transform hover:-translate-y-1 ${
            selectedId === folders[0]?.id
              ? "opacity-100 ring-2 ring-[#f36c21]"
              : "opacity-50"
          }`}
        >
          <div className="text-xs font-mono font-bold text-zinc-500 group-hover:text-zinc-300">
            {folders[0]?.name || "KIMI"}
          </div>
          <div className="mt-2 text-zinc-500">
            <DesktopIcon size={18} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedId(folders[1]?.id || "f2");
            onSelectFolder?.(folders[1]?.id || "f2");
          }}
          className={`group relative flex flex-col items-center justify-center w-32 h-28 rounded-2xl border border-white/15 bg-zinc-900/80 p-3 shadow-md hover:opacity-100 transition-all transform hover:-translate-y-1 ${
            selectedId === folders[1]?.id
              ? "opacity-100 ring-2 ring-[#f36c21]"
              : "opacity-75"
          }`}
        >
          <div className="text-xs font-mono font-bold text-zinc-400 group-hover:text-zinc-200">
            {folders[1]?.name || "KIMI"}
          </div>
          <div className="mt-2 text-zinc-400">
            <TerminalWindowIcon size={20} />
          </div>
        </button>

        {/* Center Main Plus Folder */}
        <button
          type="button"
          onClick={() => {
            setSelectedId("new");
            onNewFolder?.();
          }}
          className={`group relative flex flex-col items-center justify-center w-44 h-36 rounded-2xl border-2 border-[#f36c21]/60 bg-zinc-900/90 p-4 shadow-2xl transition-all transform hover:scale-105 ${
            selectedId === "new" ? "scale-105 ring-2 ring-[#f36c21]/80" : ""
          }`}
        >
          {/* Folder Tab Shape */}
          <div className="absolute -top-3 left-4 w-16 h-3 rounded-t-lg bg-[#f36c21]/40 border-t border-x border-[#f36c21]/60" />

          <div className="flex items-center justify-between w-full border-b border-white/10 pb-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider text-zinc-300">
              KIMI
            </span>
          </div>

          <div className="flex size-12 items-center justify-center rounded-xl bg-[#f36c21]/20 text-[#f36c21] group-hover:bg-[#f36c21] group-hover:text-white transition-colors">
            <PlusIcon size={26} weight="bold" />
          </div>
        </button>

        {/* Right Side Folders */}
        <button
          type="button"
          onClick={() => {
            setSelectedId(folders[2]?.id || "f3");
            onSelectFolder?.(folders[2]?.id || "f3");
          }}
          className="group relative flex flex-col items-center justify-center w-32 h-28 rounded-2xl border border-white/15 bg-zinc-900/80 p-3 shadow-md opacity-75 hover:opacity-100 transition-all transform hover:-translate-y-1"
        >
          <div className="text-xs font-mono font-bold text-zinc-400 group-hover:text-zinc-200">
            {folders[2]?.name || "KIMI"}
          </div>
          <div className="mt-2 text-zinc-400">
            <FileTextIcon size={20} />
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setSelectedId(folders[3]?.id || "f4");
            onSelectFolder?.(folders[3]?.id || "f4");
          }}
          className="group relative flex flex-col items-center justify-center w-28 h-24 rounded-2xl border border-white/10 bg-zinc-900/60 p-3 shadow-md opacity-50 hover:opacity-100 transition-all transform hover:-translate-y-1"
        >
          <div className="text-xs font-mono font-bold text-zinc-500 group-hover:text-zinc-300">
            {folders[3]?.name || "KIMI"}
          </div>
          <div className="mt-2 text-zinc-500">
            <TrashIcon size={18} />
          </div>
        </button>
      </div>
    </div>
  );
}
