import jsdom from "jsdom";
import { formatTime } from "../utils/dates.js";

async function getPageDocument() {
    const url = "https://lucchesivineyards.com/";
    const response = await fetch(url);
    const html = await response.text();
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return document;
}

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'Lucchesi''s Vineyard' OR venue = 'Lucchesi''s Tasting Room'`;

    const events = [];
    const document = await getPageDocument();
    const upcomingEvents = document.querySelectorAll(
        "[data-aid='CALENDAR_BIGGER_SCREEN_CONTAINER']",
    );

    for (const event of upcomingEvents) {
        const title = getTitle(event);
        const venue = getVenue(event);
        const city = "Grass Valley";
        const startDate = getStartDate(event);
        const startTime = getStartTime(event);
        const endTime = getEndTime(event);
        const admission = null;
        const url = null;
        const continuous = false;

        const eventData = {
            title,
            venue,
            city,
            startDate,
            startTime,
            endTime,
            admission,
            url,
            continuous,
        };

        events.push(eventData);
    }

    return events;
}

function getTitle(event) {
    let title = event.querySelector(
        "[data-aid='CALENDAR_EVENT_TITLE']",
    ).textContent;

    const venue = getVenue(event);
    if (venue === "Lucchesi's Vineyard") {
        title = title.split("at the Vineyard")[0].trim();
    }

    return title;
}

function getVenue(event) {
    const venues = {
        "128 Mill Street": "Lucchesi's Tasting Room",
        "19698 View Forever Lane": "Lucchesi's Vineyard",
    };
    const address = event.querySelector(
        "p[data-typography='BodyAlpha']",
    ).textContent;
    return venues[address];
}

function getStartDate(event) {
    const dateString = event.querySelector("h3").textContent;
    const [month, day, year] = dateString.split("/");
    const date = `${year}-${month}-${day}`;
    return date;
}

function getStartTime(event) {
    const element = event.querySelectorAll(
        "div[data-ux='Block'] > h4[data-typography='HeadingAlpha']",
    );
    const timeUnformatted = element[0].textContent;
    const time = formatTime(timeUnformatted);
    return time;
}

function getEndTime(event) {
    const element = event.querySelectorAll(
        "div[data-ux='Block'] > h4[data-typography='HeadingAlpha']",
    );
    const timeUnformatted = element[2].textContent;
    const time = formatTime(timeUnformatted);
    return time;
}

export default getAllEvents;
