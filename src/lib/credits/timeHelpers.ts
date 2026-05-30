export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function subSeconds(date: Date, seconds: number) {
  return new Date(date.getTime() - seconds * 1000);
}
