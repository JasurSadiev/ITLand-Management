import type { Lesson } from "./types"

/**
 * Helper function to generate recurring lessons
 */
export function generateRecurringLessons(
  lessonData: Omit<Lesson, "id" | "createdAt">,
): Omit<Lesson, "id" | "createdAt">[] {
  const lessons: Omit<Lesson, "id" | "createdAt">[] = []
  
  if (!lessonData.recurrenceEndDate) {
    return [lessonData]
  }

  // Parse YYYY-MM-DD parts to avoid local timezone issues entirely
  const [startYear, startMonth, startDay] = lessonData.date.split("-").map(Number)
  const endDateObj = new Date(lessonData.recurrenceEndDate)
  const parentId = Date.now().toString() // Use as a reference for all generated lessons
  
  if (lessonData.recurrenceType === "weekly") {
    // We'll interpret the start date as UTC to ensure stable addition of days
    const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
    
    let currentUtc = startUtc
    let currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    const endIsoDate = lessonData.recurrenceEndDate
    
    // Add the first lesson (original)
    lessons.push({
        ...lessonData,
        recurrenceParentId: parentId,
        date: currentIsoDate
    })
    
    // Add subsequent lessons
    while (true) {
        // Add 7 days in milliseconds
        currentUtc += 7 * 24 * 60 * 60 * 1000
        currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
        
        if (currentIsoDate > endIsoDate) break;
        
        lessons.push({
          ...lessonData,
          date: currentIsoDate,
          recurrenceParentId: parentId,
        })
    }
    
  } else if (lessonData.recurrenceType === "specific-days" && lessonData.recurrenceDays?.length) {
    const startUtc = Date.UTC(startYear, startMonth - 1, startDay)
    const endIsoDate = lessonData.recurrenceEndDate
    
    let currentUtc = startUtc
    let currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    
    while (currentIsoDate <= endIsoDate) {
      const d = new Date(currentUtc)
      const dayOfWeek = d.getUTCDay() // UTC Day 0=Sun, 6=Sat
      
      if (lessonData.recurrenceDays.includes(dayOfWeek)) {
        lessons.push({
          ...lessonData,
          date: currentIsoDate,
          recurrenceParentId: parentId,
        })
      }
      
      // Add 1 day
      currentUtc += 24 * 60 * 60 * 1000
      currentIsoDate = new Date(currentUtc).toISOString().split("T")[0]
    }
  } else {
    // One time or other
    return [lessonData]
  }
  
  return lessons
}
