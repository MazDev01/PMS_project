import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { schedule } from "@/lib/data";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const YEAR = 2026;
const MONTH = 6; // July (0-indexed)
const TODAY_DAY = 3;

export function MiniCalendar() {
  // days in July that have scheduled work
  const jobDays = new Set(
    schedule
      .filter((s) => {
        const [y, mo] = s.date.split("-").map(Number);
        return y === YEAR && mo - 1 === MONTH;
      })
      .map((s) => Number(s.date.slice(8, 10))),
  );

  const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <span className="text-sm font-semibold">กรกฎาคม 2569</span>
          </div>
          <Link
            href="/schedule"
            className="flex items-center gap-1 text-[0.72rem] font-medium text-primary hover:underline"
          >
            แผนงาน <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-center text-[0.62rem] text-muted-foreground">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-0.5 font-medium">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />;
            const hasJob = jobDays.has(day);
            const isToday = day === TODAY_DAY;
            return (
              <div
                key={i}
                className="relative flex aspect-square items-center justify-center"
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-[0.72rem] transition-colors",
                    isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : hasJob
                        ? "font-medium text-foreground hover:bg-muted"
                        : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {day}
                </span>
                {hasJob && !isToday && (
                  <span className="absolute bottom-0.5 size-1 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-3 border-t border-border pt-2.5 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-primary" />
            วันนี้
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary" />
            มีงาน ({jobDays.size} วัน)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
