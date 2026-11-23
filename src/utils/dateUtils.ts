export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(baseISO: string, days: number): string {
  const d = new Date(`${baseISO.slice(0, 10)}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatDisplayDate(iso: string | undefined, isAr: boolean = false): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00Z`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatShortDate(iso: string | undefined, isAr: boolean = false): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso.includes("T") ? iso : `${iso}T12:00:00Z`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function isDateOverdue(dueISO: string | undefined, referenceISO: string): boolean {
  if (!dueISO) return false;
  return dueISO.slice(0, 10) < referenceISO.slice(0, 10);
}

export function isDateToday(dueISO: string | undefined, referenceISO: string): boolean {
  if (!dueISO) return false;
  return dueISO.slice(0, 10) === referenceISO.slice(0, 10);
}

export function daysBetween(startISO: string, endISO: string): number {
  const a = new Date(`${startISO.slice(0, 10)}T12:00:00Z`).getTime();
  const b = new Date(`${endISO.slice(0, 10)}T12:00:00Z`).getTime();
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function getMonthDaysGrid(year: number, monthIndex0: number): Date[] {
  const firstDay = new Date(Date.UTC(year, monthIndex0, 1, 12, 0, 0));
  const startDayOfWeek = firstDay.getUTCDay(); // 0=Sun
  const startGrid = new Date(firstDay);
  startGrid.setUTCDate(startGrid.getUTCDate() - startDayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startGrid);
    d.setUTCDate(startGrid.getUTCDate() + i);
    days.push(d);
  }
  return days;
}
