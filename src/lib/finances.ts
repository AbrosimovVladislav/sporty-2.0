type AttendanceLike = {
  attended: boolean | null;
  attended_confirmed: boolean | null;
  paid: boolean | null;
  paid_confirmed: boolean | null;
  paid_amount?: number | null;
};

export function isAttendanceAttended(a: AttendanceLike): boolean {
  return (a.attended_confirmed ?? a.attended) === true;
}

export function isAttendancePaid(a: AttendanceLike): boolean {
  return (a.paid_confirmed ?? a.paid) === true;
}

export function getExpectedAmount(a: AttendanceLike, pricePerPlayer: number): number {
  return isAttendanceAttended(a) ? pricePerPlayer : 0;
}

export function getPaidAmount(a: AttendanceLike, pricePerPlayer: number): number {
  if (!isAttendancePaid(a)) return 0;
  if (a.paid_amount != null) return a.paid_amount;
  return pricePerPlayer;
}
