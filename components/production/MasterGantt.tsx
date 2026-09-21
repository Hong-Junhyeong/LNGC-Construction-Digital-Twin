"use client";
import { masterProjectFinish, masterTasks } from "@/data/master-schedule";
import { DataSourceBadge } from "@/components/dashboard/Primitives";

const groups = [
  "DESIGN",
  "SUPPLY",
  "PRODUCTION",
  "ERECTION",
  "SYSTEMS",
  "COMMISSIONING",
  "DELIVERY",
] as const;
const scale = Array.from(
  { length: Math.floor(masterProjectFinish / 90) + 1 },
  (_, i) => i * 90,
);
const pct = (day: number) => (day / masterProjectFinish) * 100;

export default function MasterGantt() {
  return (
    <div className="master-gantt-wrap">
      <div className="master-gantt-legend">
        <span>
          <i className="master-key master-key-design" />
          Design / supply
        </span>
        <span>
          <i className="master-key master-key-production" />
          Production / erection
        </span>
        <span>
          <i className="master-key master-key-systems" />
          Systems / commissioning
        </span>
        <DataSourceBadge type="ASSUMPTION" />
      </div>
      <div
        className="master-gantt"
        style={{ "--master-days": masterProjectFinish } as React.CSSProperties}
      >
        <div className="master-gantt-scale">
          <strong>Process / planned dates</strong>
          <div>
            {scale.map((day) => (
              <span key={day} style={{ left: `${pct(day)}%` }}>
                D{day}
              </span>
            ))}
          </div>
          <small>24×7 elapsed-day model · project start 2025-01-06</small>
        </div>
        {groups.map((group) => (
          <section
            key={group}
            className="master-gantt-group"
            aria-label={`${group} schedule`}
          >
            <h3>{group}</h3>
            {masterTasks
              .filter((task) => task.ganttGroup === group)
              .map((task) => (
                <div className="master-gantt-row" key={task.taskId}>
                  <div className="master-task-label">
                    <strong>{task.name}</strong>
                    <span>
                      {task.plannedStartDate} → {task.plannedFinishDate}
                    </span>
                    <small>
                      {task.predecessorIds.length
                        ? `After: ${task.predecessorIds.join(", ")}`
                        : "Project start"}
                    </small>
                  </div>
                  <div className="master-gantt-track">
                    <span
                      className={`master-gantt-bar group-${group.toLowerCase()}`}
                      style={{
                        left: `${pct(task.baselineStartDay)}%`,
                        width: `${Math.max(pct(task.durationDays), 0.35)}%`,
                      }}
                      title={`${task.taskId}: D${task.baselineStartDay}–D${task.baselineFinishDay}`}
                    />
                    {task.durationDays === 0 && (
                      <i
                        className="master-milestone"
                        style={{ left: `${pct(task.baselineStartDay)}%` }}
                      />
                    )}
                  </div>
                  <span className="master-task-id">{task.taskId}</span>
                </div>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}
