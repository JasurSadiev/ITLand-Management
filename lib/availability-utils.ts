import { Lesson, User } from "./types";
import { parse, addMinutes, isWithinInterval, format, startOfDay, endOfDay, addDays, getDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

/**
 * Calculates available slots for a teacher on a specific date.
 */
export function getAvailableSlots(
  dateStr: string,
  duration: number,
  teacher: User,
  existingLessons: Lesson[],
  viewerTimezone: string = "UTC"
) {
  const teacherTimezone = teacher.timezone || "UTC";
  const date = parse(dateStr, "yyyy-MM-dd", new Date());
  
  // Create the start and end of the day in the VIEWER's perspective
  const viewerDayStart = fromZonedTime(`${dateStr} 00:00:00`, viewerTimezone);
  const viewerDayEnd = fromZonedTime(`${dateStr} 23:59:59`, viewerTimezone);

  // 1. Get ALL active working hours for this day
  // Note: We need to check if ANY working hours in TEACHER's timezone overlap this day in VIEWER's timezone
  // For simplicity, we'll check the current day, day before, and day after in teacher's time
  const daysToCheck = [
    getDay(addDays(date, -1)),
    getDay(date),
    getDay(addDays(date, 1))
  ];
  
  const relevantWorkingHours = teacher.workingHours?.filter(wh => 
    daysToCheck.includes(wh.dayOfWeek) && wh.active
  ) || [];

  // 2. Map working hours to absolute UTC intervals for this viewer date range
  const workIntervals: { start: Date, end: Date }[] = [];
  
  for (const wh of relevantWorkingHours) {
    // We check 3 days (around the viewer's current date) to handle timezone shifts
    [-1, 0, 1].forEach(offset => {
        const d = addDays(date, offset);
        if (getDay(d) === wh.dayOfWeek) {
            const dateS = format(d, "yyyy-MM-dd");
            const startUTC = fromZonedTime(`${dateS} ${wh.startTime}`, teacherTimezone);
            const endUTC = fromZonedTime(`${dateS} ${wh.endTime}`, teacherTimezone);
            
            // Check if this window overlaps with our viewer's day
            if (startUTC < viewerDayEnd && endUTC > viewerDayStart) {
                workIntervals.push({ start: startUTC, end: endUTC });
            }
        }
    });
  }

  if (workIntervals.length === 0) return [];

  // 3. Occupied intervals (Lessons and Blackouts)
  // We MUST parse these correctly relative to their intended timezones
  const dayLessons = existingLessons.filter(l => 
    l.status !== "cancelled-student" && l.status !== "cancelled-teacher"
  );
  
  const occupiedIntervals = [
    ...dayLessons.map(l => {
      const lTz = l.timezone || teacherTimezone; // Fallback to teacher timezone
      const start = fromZonedTime(`${l.date} ${l.time}`, lTz);
      return {
        start,
        end: addMinutes(start, l.duration)
      };
    }),
    ... (teacher.blackoutSlots || []).map(bs => {
      // Blackouts are usually in the teacher's timezone
      const start = fromZonedTime(`${bs.date} ${bs.startTime}`, teacherTimezone);
      const end = fromZonedTime(`${bs.date} ${bs.endTime}`, teacherTimezone);
      return { start, end };
    })
  ];

  // 4. Generate slots in VIEWER timezone
  const slots: string[] = [];
  
  for (const interval of workIntervals) {
    // Convert interval to viewer's local time for iteration
    let currentSlot = toZonedTime(interval.start, viewerTimezone);
    const intervalEnd = toZonedTime(interval.end, viewerTimezone);

    // Ensure we start at or after the viewer's day begin
    const dayStart = toZonedTime(viewerDayStart, viewerTimezone);
    const dayEnd = toZonedTime(viewerDayEnd, viewerTimezone);
    
    if (currentSlot < dayStart) currentSlot = dayStart;

    while (currentSlot < intervalEnd && currentSlot < dayEnd) {
      const slotEnd = addMinutes(currentSlot, duration);
      
      if (slotEnd > intervalEnd || slotEnd > dayEnd) break;

      // Check overlap in absolute time (UTC/Date objects)
      const slotStartUTC = fromZonedTime(format(currentSlot, "yyyy-MM-dd HH:mm:ss"), viewerTimezone);
      const slotEndUTC = addMinutes(slotStartUTC, duration);

      const isOccupied = occupiedIntervals.some(occ => {
        return (
          (slotStartUTC >= occ.start && slotStartUTC < occ.end) || // Start is inside
          (slotEndUTC > occ.start && slotEndUTC <= occ.end) || // End is inside
          (slotStartUTC <= occ.start && slotEndUTC >= occ.end) // Overlaps entire internal
        );
      });

      if (!isOccupied) {
        slots.push(format(currentSlot, "HH:mm"));
      }

      currentSlot = addMinutes(currentSlot, 30);
    }
  }

  return Array.from(new Set(slots)).sort();
}
