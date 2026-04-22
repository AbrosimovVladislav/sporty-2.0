type AttendanceLike = {
  attended: boolean | null;
};

export function isAttendanceAttended(a: AttendanceLike): boolean {
  return a.attended === true;
}

export function getExpectedAmount(a: AttendanceLike, pricePerPlayer: number): number {
  return isAttendanceAttended(a) ? pricePerPlayer : 0;
}

export function calcBalance(paid: number, expected: number): number {
  return paid - expected;
}
