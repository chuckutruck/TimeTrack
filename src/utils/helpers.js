import { format, parseISO, isSaturday, isSunday, setHours, setMinutes, getHours, getMinutes, isValid, addHours, addMinutes, isBefore, isAfter, isSameDay, getDay } from 'date-fns';
import { es, enUS, sv } from 'date-fns/locale';
// No longer importing uuid as it's handled by Firebase push()

const locales = { es, en: enUS, sv };

export const getLocalizedDateFnsLocale = (lang) => {
  return locales[lang] || enUS;
};

export const calculateHours = (startTime, endTime, breakTime) => {
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  let diff = (end - start) / (1000 * 60 * 60); // difference in hours
  if (diff < 0) { // overnight
    diff += 24;
  }
  return Math.max(0, diff - (breakTime / 60));
};

export const classifyHours = (dateString, startTimeStr, endTimeStr) => {
  const d = parseISO(dateString);
  if (!isValid(d)) return {};

  let startDateTime = setMinutes(setHours(d, parseInt(startTimeStr.split(':')[0])), parseInt(startTimeStr.split(':')[1]));
  let endDateTime = setMinutes(setHours(d, parseInt(endTimeStr.split(':')[0])), parseInt(endTimeStr.split(':')[1]));

  // Handle overnight entries by adding 24 hours to endDateTime if it's before startDateTime
  if (isBefore(endDateTime, startDateTime)) {
    endDateTime = addHours(endDateTime, 24);
  }

  const classified = {
    "Sueldo base": 0,
    "OB 1": 0,
    "OB 2": 0,
    "OB 3": 0,
    "OB 4": 0,
  };

  // Define periods in 24-hour format
  const OB_PERIODS = {
    "Sueldo base": [{ start: 6, end: 18 }],
    "OB 1": [{ start: 18, end: 22 }],
    "OB 2": [{ start: 22, end: 24 }, { start: 0, end: 6 }], // 22:00-00:00 and 00:00-06:00
    "OB 3": [{ start: 13, end: 24 }], // Saturday after 13:00
    "OB 4": [{ start: 0, end: 24 }], // Sunday/Holiday all day
  };

  let current = new Date(startDateTime);

  // Iterate minute by minute to accurately classify time segments
  while (isBefore(current, endDateTime)) {
    let nextMinute = addMinutes(current, 1);
    if (isAfter(nextMinute, endDateTime)) {
      nextMinute = new Date(endDateTime);
    }

    const duration = (nextMinute.getTime() - current.getTime()) / (1000 * 60 * 60); // Duration in hours (e.g., 1/60 for a minute)

    const dayOfWeek = getDay(current); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = getHours(current);

    let assigned = false;

    // Check for OB 4 (Sunday)
    if (dayOfWeek === 0) { // Sunday
      classified["OB 4"] += duration;
      assigned = true;
    }
    // Check for OB 3 (Saturday after 13:00)
    else if (dayOfWeek === 6 && hour >= OB_PERIODS["OB 3"][0].start) { // Saturday after 13:00
      classified["OB 3"] += duration;
      assigned = true;
    }

    // If not assigned to OB3 or OB4, apply weekday rules
    if (!assigned) {
      // Check for OB 2 (22:00-06:00)
      if ((hour >= OB_PERIODS["OB 2"][0].start && hour < OB_PERIODS["OB 2"][0].end) || (hour >= OB_PERIODS["OB 2"][1].start && hour < OB_PERIODS["OB 2"][1].end)) {
        classified["OB 2"] += duration;
      }
      // Check for OB 1 (18:00-22:00)
      else if (hour >= OB_PERIODS["OB 1"][0].start && hour < OB_PERIODS["OB 1"][0].end) {
        classified["OB 1"] += duration;
      }
      // Check for Sueldo base (06:00-18:00)
      else if (hour >= OB_PERIODS["Sueldo base"][0].start && hour < OB_PERIODS["Sueldo base"][0].end) {
        classified["Sueldo base"] += duration;
      } else {
        // This else block catches any remaining time that doesn't fit the above,
        // which might happen for edge cases or if the time falls outside defined periods.
        // For example, Saturday 00:00-06:00 or 06:00-13:00 should fall into weekday categories.
        // We can assign it to Sueldo base or OB2 based on hour.
        if (hour >= 0 && hour < 6) { // Early morning (00:00-06:00)
          classified["OB 2"] += duration;
        } else if (hour >= 6 && hour < 18) { // Day time (06:00-18:00)
          classified["Sueldo base"] += duration;
        } else if (hour >= 18 && hour < 22) { // Evening (18:00-22:00)
          classified["OB 1"] += duration;
        } else if (hour >= 22 && hour < 24) { // Late evening (22:00-00:00)
          classified["OB 2"] += duration;
        }
      }
    }
    current = nextMinute;
  }

  // Round to 2 decimal places to avoid floating point inaccuracies
  for (const key in classified) {
    classified[key] = parseFloat(classified[key].toFixed(2));
  }

  return classified;
};


export const getSuggestedTimes = (date) => {
  const d = parseISO(date);
  if (!isValid(d)) return { suggestedStart: '08:00', suggestedEnd: '17:00' }; // Default if date is invalid

  const hour = getHours(new Date());
  let suggestedStart = '08:00';
  let suggestedEnd = '17:00';

  if (isSaturday(d)) {
    suggestedStart = '13:00';
    suggestedEnd = '20:00';
  } else if (isSunday(d)) {
    suggestedStart = '10:00';
    suggestedEnd = '18:00';
  } else { // Weekday
    if (hour >= 18 && hour < 22) {
      suggestedStart = '18:00';
      suggestedEnd = '22:00';
    } else if (hour >= 22 || hour < 6) {
      suggestedStart = '22:00';
      suggestedEnd = '06:00'; // Next day
    }
  }
  return { suggestedStart, suggestedEnd };
};

export const generateAvatar = (firstName, lastName) => {
  const initials = `${firstName ? firstName[0] : ''}${lastName ? lastName[0] : ''}`.toUpperCase();
  return initials;
};

export const exportToPdf = async (elementId, filename, lang = 'en') => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Element not found for PDF export:", elementId);
    return;
  }

  // Ensure html2canvas and jspdf are loaded
  // These are loaded via script tags in public/index.html
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    console.error("html2canvas or jspdf is not defined. Make sure the scripts are loaded in public/index.html.");
    alert("Error: Las librerías de exportación (html2canvas, jspdf) no están cargadas. Por favor, verifica public/index.html.");
    return;
  }

  try {
    const canvas = await html2canvas(input, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Add image to PDF, scaling it to fit the page width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error during PDF export:", error);
    alert("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.");
  }
};

// JSON export/import functions removed as requested