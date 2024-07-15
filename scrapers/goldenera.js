import jsdom from "jsdom";
import { formatTime } from "../utils/dates.js";

async function getPageDocument() {
    const url = "https://www.goldeneralounge.com/events";
    const response = await fetch(url);

    if (response.ok) {
        const html = await response.text();
        const { JSDOM } = jsdom;
        const dom = new JSDOM(html);
        const document = dom.window.document;
        return document;
    }
}

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'Golden Era Lounge' AND manual_upload = FALSE`;

    const events = [];
    const document = await getPageDocument();
    const upcomingEvents = document.querySelectorAll(
        "article.eventlist-event--upcoming",
    );

    for (const event of upcomingEvents) {
        const title = getTitle(event);
        const venue = "Golden Era Lounge";
        const city = "Nevada City";
        const startDate = getStartDate(event);
        const startTime = getStartTime(event);
        const endTime = getEndTime(event);
        const admission = null;
        const url = getUrl(event);

        const eventData = {
            title,
            venue,
            city,
            startDate,
            startTime,
            endTime,
            admission,
            url,
        };

        events.push(eventData);
    }

    console.log(`Retrieved ${events.length} events from Golden Era Lounge`);
    return events;
}

function getTitle(event) {
    const title = event.querySelector("h1").textContent;
    return title;
}

function getStartTimeElement(event) {
    const timeElement = event.querySelector("time.event-time-localized-start");
    return timeElement;
}

function getStartDate(event) {
    const timeElement = getStartTimeElement(event);
    const startDate = timeElement.getAttribute("datetime");
    return startDate;
}

function getStartTime(event) {
    const timeElement = getStartTimeElement(event);
    const time = formatTime(timeElement.textContent);
    return time;
}

function getEndTime(event) {
    const timeElement = event.querySelector("time.event-time-localized-end");
    const time = formatTime(timeElement.textContent);
    return time;
}

function getUrl(event) {
    const linkElement = event.querySelector("a.eventlist-button");
    const basePath = "https://www.goldeneralounge.com";
    const url = basePath + linkElement.href;
    return url;
}

export default getAllEvents;
