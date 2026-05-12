import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";

interface CalendarDay {
  date: string;
  count: number;
  items: Array<{
    id: number;
    candidateId: number;
    stage: string | null;
    interviewer: string | null;
    scheduledTime: string | null;
    status: string | null;
    type: string | null;
  }>;
}

export function InterviewCalendar({
  data,
  year,
  month,
  onPrevMonth,
  onNextMonth,
}: {
  data?: { year: number; month: number; total: number; days: CalendarDay[] };
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  const dayMap: Record<string, CalendarDay> = {};
  if (data?.days) {
    for (const d of data.days) {
      dayMap[d.date] = d;
    }
  }

  const cells: Array<{
    day: number | null;
    date: string | null;
    data?: CalendarDay;
  }> = [];
  // pad start
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ day: null, date: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, date: dateStr, data: dayMap[dateStr] });
  }

  const typeIcons: Record<string, string> = {
    视频: "📹",
    电话: "📞",
    现场: "🏢",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onPrevMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#2D8FF0]" />
          <span className="text-lg font-semibold text-[#1E293B]">
            {year}年{month}月
          </span>
          {data && (
            <span className="text-sm text-[#94A3B8]">· {data.total}场面试</span>
          )}
        </div>
        <button
          onClick={onNextMonth}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map(w => (
          <div
            key={w}
            className="text-center text-xs font-medium text-slate-400 py-2"
          >
            {w}
          </div>
        ))}
        {cells.map((cell, idx) => (
          <div
            key={idx}
            className={`min-h-[80px] border border-transparent rounded-lg p-1 ${
              cell.date
                ? "hover:border-[#DBEAFE] hover:bg-[#F0F7FF] transition-colors"
                : ""
            }`}
          >
            {cell.day && (
              <>
                <div
                  className={`text-xs font-medium mb-1 px-1 ${
                    cell.date === new Date().toISOString().slice(0, 10)
                      ? "bg-[#2D8FF0] text-white rounded-full w-5 h-5 flex items-center justify-center"
                      : "text-slate-500"
                  }`}
                >
                  {cell.day}
                </div>
                {cell.data && (
                  <div className="space-y-0.5">
                    {cell.data.items.slice(0, 3).map(iv => (
                      <div
                        key={iv.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] truncate"
                        title={`${iv.stage} · ${iv.interviewer} #${iv.candidateId}`}
                      >
                        {typeIcons[iv.type || ""] || "📋"} #{iv.candidateId}{" "}
                        {iv.stage}
                      </div>
                    ))}
                    {cell.data.count > 3 && (
                      <div className="text-[10px] text-slate-400 pl-1">
                        +{cell.data.count - 3}场
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {data?.days && data.days.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-medium text-[#1E293B] mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            本月面试列表
          </h3>
          <div className="space-y-2">
            {data.days.flatMap(d =>
              d.items.map(iv => (
                <div
                  key={iv.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-50 text-sm"
                >
                  <span className="text-slate-400 text-xs w-20">
                    {iv.scheduledTime?.slice(0, 10)}
                  </span>
                  <span className="font-medium text-[#1E293B]">
                    #{iv.candidateId}
                  </span>
                  <span className="text-[#94A3B8]">{iv.stage}</span>
                  <span className="text-[#94A3B8]">{iv.interviewer}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-slate-200 text-slate-500">
                    {iv.type}
                  </span>
                  <span
                    className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                      iv.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : iv.status === "cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {iv.status === "completed"
                      ? "完成"
                      : iv.status === "cancelled"
                        ? "取消"
                        : "待面"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
