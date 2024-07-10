const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function getUTCDateString(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const dateString = `${year}-${month}-${day}`;
    return dateString;
}

function formatTime(timeStr) {
    const timeStrFormatted = timeStr.replace(".", "").toLowerCase();
    const meridiem = timeStrFormatted.match(/am|pm/);
    const time = timeStrFormatted.match(/(\d{1,2})(:\d{2})?(?=\s*[ap]m)/i);

    let hour;

    if (meridiem && meridiem[0] === "am") {
        hour = time[1] == 12 ? 0 : parseInt(time[1]);
    } else if (meridiem && meridiem[0] === "pm") {
        hour = parseInt(time[1]) + (time[1] == 12 ? 0 : 12);
    } else {
        hour = parseInt(time[1]);
    }

    const minutes = time[2] ? time[2] : ":00";
    return String(hour).padStart(2, "0") + minutes;
}

function extractTimes(timeString) {
    const patterns = [
        /(\d{1,2}:\d{2}\s*(?:am|pm)?)(?:\s*[-–—]?\s*(\d{1,2}:\d{2}\s*(?:am|pm)?))?/i,
        /(\d{1,2}(?::\d{2})?)(?:\s*[-–—]?\s*(\d{1,2}(?::\d{2})?))?/,
        /(\d{1,2}\s*(?:am|pm)?)(?:\s*[-–—]?\s*(\d{1,2}\s*(?:am|pm)?))?/i,
    ];

    let startTime = "";
    let endTime = "";

    for (const pattern of patterns) {
        const match = timeString.match(pattern);
        if (match) {
            startTime = match[1].trim();
            endTime = match[2] ? match[2].trim() : "";
            break;
        }
    }

    return [startTime, endTime];
}

function dateIsInvalid(date) {
    return String(date) === "Invalid Date";
}

export { months, formatTime, extractTimes, dateIsInvalid, getUTCDateString };
