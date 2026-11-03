import { LinkIcon } from "@phosphor-icons/react";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: "step-1",
    title: "Global Pool of Emulators & Containers",
    description:
      "Deployed on KVM-accelerated hypervisors. Enables instant warm starts, snapshot rollbacks, and multi-device matrix orchestration across API 28–34."
  },
  {
    id: "step-2",
    title: "REST & WebSocket API Support",
    description:
      "Lab workers offer real-time ADB control, noVNC video streams, memory dumping, and structured JSON telemetry extraction for AI agents."
  },
  {
    id: "step-3",
    title: "Supports Common Mobile Toolkits",
    description:
      "Built-in Frida, Objection, Appium, Espresso, and mitmproxy support. Gives security researchers full control when needed with industry-standard tooling."
  },
  {
    id: "step-4",
    title: "Autonomous Agent Execution Mode",
    description:
      "Stateful agent loops inspect decompiled bytecode (JADX), identify attack vectors, synthesize Frida bypass scripts, and verify vulnerabilities automatically."
  }
];

export interface WorkflowStepperProps {
  title?: string;
  steps?: WorkflowStep[];
  className?: string;
}

export function WorkflowStepper({
  title = "Made for Programmable Automation",
  steps = DEFAULT_STEPS,
  className = ""
}: WorkflowStepperProps) {
  return (
    <div
      className={`apk-crosshair-box relative rounded-2xl border border-(--iux-border) bg-[#090d14] p-8 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {title}
        </h2>
        <LinkIcon
          size={18}
          className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
        />
      </div>

      <div className="relative pl-8 space-y-8">
        {/* Vertical Dashed Line */}
        <div className="absolute top-3 bottom-3 left-3 w-px border-l border-dashed border-zinc-700 pointer-events-none" />

        {steps.map((step) => (
          <div key={step.id} className="relative flex items-start gap-5">
            {/* Target Ring Node Indicator */}
            <div className="absolute -left-8 top-1 flex size-6 items-center justify-center">
              <div className="size-6 rounded-full border border-dashed border-zinc-600 bg-[#090d14] flex items-center justify-center">
                <div className="size-2 rounded-full bg-zinc-400 group-hover:bg-[#f36c21]" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400 max-w-2xl">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
