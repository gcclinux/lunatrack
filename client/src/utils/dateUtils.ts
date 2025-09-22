/**
 * Formats a date string from 'YYYY-MM-DD' format to 'Weekday DD Month YYYY' format
 * Example: '2025-09-12' -> 'Fri 12 Sept 2025'
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00')
  
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  
  const weekday = weekdays[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  
  return `${weekday} ${day} ${month} ${year}`
}