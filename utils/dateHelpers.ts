// utils/dateHelpers.ts

export interface ParsedDate {
  date: string;      // ISO string
  month: string;     // YYYY-MM
  year: number;
  success: boolean;
}

export const extractDateFromSMS = (text: string): ParsedDate => {
  const now = new Date();

  // Pattern 1: DD-MM-YYYY or DD/MM/YYYY
  const pattern1 = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})/;
  const match1 = text.match(pattern1);

  if (match1) {
    try {
      let day = parseInt(match1[1]);
      let month = parseInt(match1[2]) - 1; // JS months are 0-indexed
      let year = parseInt(match1[3]);

      // Handle 2-digit years
      if (year < 100) {
        year = year < 50 ? 2000 + year : 1900 + year;
      }

      const parsedDate = new Date(year, month, day);
      
      // Validate the date
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month && 
          parsedDate.getDate() === day) {
        
        const isoString = parsedDate.toISOString();
        const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        return {
          date: isoString,
          month: monthString,
          year: year,
          success: true
        };
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  }

  // Pattern 2: YYYY-MM-DD (ISO format already in SMS)
  const pattern2 = /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/;
  const match2 = text.match(pattern2);

  if (match2) {
    try {
      const year = parseInt(match2[1]);
      const month = parseInt(match2[2]) - 1;
      const day = parseInt(match2[3]);

      const parsedDate = new Date(year, month, day);
      
      if (parsedDate.getFullYear() === year && 
          parsedDate.getMonth() === month && 
          parsedDate.getDate() === day) {
        
        const isoString = parsedDate.toISOString();
        const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        return {
          date: isoString,
          month: monthString,
          year: year,
          success: true
        };
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  }

  // Pattern 3: Look for "on DD Mon YYYY" (e.g., "on 29 Nov 2025")
  const monthNames = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
  ];
  
  const pattern3 = /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{4})/i;
  const match3 = text.match(pattern3);

  if (match3) {
    try {
      const day = parseInt(match3[1]);
      const monthName = match3[2].toLowerCase().substring(0, 3);
      const month = monthNames.indexOf(monthName);
      const year = parseInt(match3[3]);

      if (month !== -1) {
        const parsedDate = new Date(year, month, day);
        
        if (parsedDate.getFullYear() === year && 
            parsedDate.getMonth() === month && 
            parsedDate.getDate() === day) {
          
          const isoString = parsedDate.toISOString();
          const monthString = `${year}-${String(month + 1).padStart(2, '0')}`;
          
          return {
            date: isoString,
            month: monthString,
            year: year,
            success: true
          };
        }
      }
    } catch (e) {
      console.error('Date parsing error:', e);
    }
  }

  // Fallback: use current date
  const isoString = now.toISOString();
  const monthString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  return {
    date: isoString,
    month: monthString,
    year: now.getFullYear(),
    success: false
  };
};

export const formatDate = (isoString: string): string => {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};