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
  // The date requested by the VIEWER (e.g. "2023-10-25" in New York)
  // We need to find slots where the lesson START time falls within this day in VIEWER's timezone
  
  // Define the viewer's day range in UTC
  const viewerDayStart = fromZonedTime(`${dateStr} 00:00:00`, viewerTimezone);
  const viewerDayEnd = fromZonedTime(`${dateStr} 23:59:59`, viewerTimezone);

  // 1. Get ALL active working hours that might overlap with this viewer day
  // Since timezones can shift days, we check the day before, current, and day after in TEACHER's perspective.
  
  const relevantWorkingHours = teacher.workingHours?.filter(wh => wh.active) || [];
  
  // 2. Map working hours to absolute UTC intervals
  const workIntervals: { start: Date, end: Date }[] = [];
  
  // We iterate relative to the teacher's date that corresponds to the viewer's date
  // A safe bet is to check a range of dates around the viewer's date
  const baseDate = parse(dateStr, "yyyy-MM-dd", new Date());
  
  [-1, 0, 1].forEach(offset => {
    const d = addDays(baseDate, offset);
    // This 'd' is just a reference date. We need to construct the actual time in teacher's zone.
    // The working hours are generic "Mondays", "Tuesdays".
    // We need to find which specific date `d` corresponds to `wh.dayOfWeek`.
    
    // Actually, simpler: iterate through the relevant dates, get their Day of Week,
    // match with working hours, and if match, create UTC interval.
    
    const dayOfWeek = getDay(d);
    const dateString = format(d, "yyyy-MM-dd");
    
    const daysHours = relevantWorkingHours.filter(wh => wh.dayOfWeek === dayOfWeek);
    
    daysHours.forEach(wh => {
         const startUTC = fromZonedTime(`${dateString} ${wh.startTime}`, teacherTimezone);
         const endUTC = fromZonedTime(`${dateString} ${wh.endTime}`, teacherTimezone);
         
         // Handle overnight shifts if end < start? Assuming single day ranges for now as per schema.
         // If startUTC < viewerDayEnd AND endUTC > viewerDayStart, it overlaps.
         if (startUTC < viewerDayEnd && endUTC > viewerDayStart) {
             workIntervals.push({ start: startUTC, end: endUTC });
         }
    });
  });

  if (workIntervals.length === 0) return [];

  // 3. Occupied intervals (Lessons and Blackouts)
  const occupiedIntervals: { start: Date, end: Date }[] = [];

  // Lessons
  existingLessons.forEach(l => {
    if (l.status === "cancelled-student" || l.status === "cancelled-teacher") return;
    const lTz = l.timezone || teacherTimezone;

    const addInterval = (instanceDate: string) => {
        const start = fromZonedTime(`${instanceDate} ${l.time}`, lTz);
        const end = addMinutes(start, l.duration);
        // Only add if it overlaps our viewer day (optimization)
        if (start < viewerDayEnd && end > viewerDayStart) {
            occupiedIntervals.push({ start, end });
        }
    };

    // One-time
    addInterval(l.date);

    // Recurrence - same logic as before but filtered
    if ((l.recurrenceType === "weekly" || l.recurrenceType === "specific-days") && 
        l.date <= dateStr && // Optimization: Recurrence must have started
        (!l.recurrenceEndDate || l.recurrenceEndDate >= dateStr)) { // and not ended
        
         const targetDate = parse(dateStr, "yyyy-MM-dd", new Date());
         const targetDay = getDay(targetDate);
         
         // We only care if the recurrences fall on dates we are interested in (viewer's date)
         // Actually, we need to check if ANY instance blocks our slots.
         // But simplicity: just check instances around our target date.
         
         [-1, 0, 1].forEach(offset => {
             const d = addDays(targetDate, offset);
             const dStr = format(d, "yyyy-MM-dd");
             const dDay = getDay(d);
             
             if (l.date > dStr) return; // Haven't started yet

             let matches = false;
             if (l.recurrenceType === "weekly") {
                 const startDay = getDay(parse(l.date, "yyyy-MM-dd", new Date()));
                 if (startDay === dDay) matches = true;
             } else if (l.recurrenceType === "specific-days") {
                 if (l.recurrenceDays?.includes(dDay)) matches = true;
             }
             
             if (matches && dStr !== l.date) { // Don't add duplicate if one-time handled it
                 addInterval(dStr);
             }
         });
    }
  });

  // Blackouts
  (teacher.blackoutSlots || []).forEach(bs => {
    const start = fromZonedTime(`${bs.date} ${bs.startTime}`, teacherTimezone);
    const end = fromZonedTime(`${bs.date} ${bs.endTime}`, teacherTimezone);
    if (start < viewerDayEnd && end > viewerDayStart) {
        occupiedIntervals.push({ start, end });
    }
  });

  // 4. Generate slots
  const slots: string[] = [];
  
  // We step through the viewer's day in 30min increments
  // Start exactly at viewer's day start (00:00 local time = viewerDayStart UTC)
  let currentSpotUTC = viewerDayStart;
  
  while (currentSpotUTC < viewerDayEnd) {
      const slotEndUTC = addMinutes(currentSpotUTC, duration);
      
      // Check if this slot falls within ANY work interval
      // Slot must be FULLY inside a work interval
      const inWorkHours = workIntervals.some(window => 
          currentSpotUTC >= window.start && slotEndUTC <= window.end
      );

      if (inWorkHours) {
          // Check if overlaps with any occupied interval
          const isOccupied = occupiedIntervals.some(occ => 
              (currentSpotUTC < occ.end && slotEndUTC > occ.start)
          );
          
          if (!isOccupied) {
              // Add to slots - format in VIEWER'S timezone
              const slotTimeLocal = toZonedTime(currentSpotUTC, viewerTimezone);
              slots.push(format(slotTimeLocal, "HH:mm"));
          }
      }

      currentSpotUTC = addMinutes(currentSpotUTC, 30);
  }

  return Array.from(new Set(slots)).sort();
}
