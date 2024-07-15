import jsdom from "jsdom";
import getOnyxShowings from "./onyx.js";
import { formatTime } from "../utils/dates.js";

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'Nevada Theatre' AND manual_upload = FALSE`;

    let events = [];
    let month = getCurrentMonth();
    let monthEvents;

    do {
        const monthStr = String(month).padStart(2, "0");
        monthEvents = await getMonthEvents(monthStr);

        for (const event of monthEvents) {
            const isDuplicate = checkForDuplicateEvent(events, event);
            if (isDuplicate) {
                continue;
            }
            events.push(event);
        }

        month += 1;
    } while (monthEvents.length !== 0);

    const onyxEvents = await getOnyxShowings();
    events = events.concat(onyxEvents);

    console.log(`Retrieved ${events.length} events from The Nevada Theatre`);
    return events;
}

async function getMonthDocument(monthStr) {
    const html = await getPageData("2024", monthStr);
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return document;
}

async function getMonthEvents(monthStr) {
    const events = [];
    const document = await getMonthDocument(monthStr);
    const eventContainers = document.querySelectorAll(
        "article.mec-event-article",
    );

    for (const element of eventContainers) {
        const title = getTitle(element);
        if (title.toLowerCase().includes("onyx downtown")) {
            continue;
        }

        const venue = getVenue(element);
        const city = "Nevada City";
        const startDate = getStartDate(element);
        const startTime = getStartTime(element);
        const endTime = null;
        const admission = null;
        const url = getUrl(element);

        events.push({
            title,
            venue,
            city,
            startDate,
            startTime,
            endTime,
            admission,
            url,
        });
    }

    return events;
}

function getTitle(element) {
    const title = element.querySelector("h4").textContent;
    return title;
}

function getVenue(element) {
    const venue = element.querySelector(".mec-event-loc-place").textContent;
    return venue;
}

function getStartDate(element) {
    const dateString = element.parentElement.getAttribute("data-mec-cell");
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const date = `${year}-${month}-${day}`;
    return date;
}

function getStartTime(element) {
    const timeString = element.querySelector(".mec-event-time").textContent;
    const time = formatTime(timeString);
    return time;
}

function getUrl(element) {
    const url = element.querySelector("h4 > a").href;
    return url;
}

async function getPageData(year, month) {
    const response = await fetch(
        "https://nevadatheatre.com/wp-admin/admin-ajax.php",
        {
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: `action=mec_monthly_view_load_month&mec_year=${year}&mec_month=${month}&atts%5Bcategoryn&atts%5Bsk-options%5D%5Bmonthly_view%5D%5Bdisplay_all%5D%5Bdaily_view%5D=0&atts%5Bsk-options%5D%5Bcarousel%5D%5Bsed_method%5D=0&atts%5Bsk-options%5D%5Bcarousel%5D%5Bsk-options`,
            method: "POST",
        },
    );

    const data = await response.json();
    return data.events_side;
}

function getCurrentMonth() {
    const date = new Date();
    const month = date.getMonth() + 1;
    return month;
}

function checkForDuplicateEvent(events, event) {
    return events.some(
        (monthEvent) => JSON.stringify(event) === JSON.stringify(monthEvent),
    );
}

export default getAllEvents;
