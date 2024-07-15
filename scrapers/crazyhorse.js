import jsdom from "jsdom";
import { extractTimes, formatTime } from "../utils/dates.js";

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'Crazy Horse Saloon' and manual_upload = FALSE`;

    let pageNum = 1;
    let pageEvents;
    let events = [];

    do {
        pageEvents = await getPageEvents(pageNum);
        events = events.concat(pageEvents);
        pageNum++;
    } while (pageEvents.length > 0);

    console.log(`Retrieved ${events.length} events from Crazy Horse Saloon`);
    return events;
}

async function getPageDocument(pageNum) {
    const response = await fetch(
        `https://crazyhorsenc.com/shows/photo/page/${pageNum}/`,
    );

    const html = await response.text();
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return document;
}

async function getPageArticles(pageNum) {
    const pageDocument = await getPageDocument(pageNum);
    const articles = pageDocument.querySelectorAll(
        "article.tribe-common-g-col",
    );

    return articles;
}

async function getPageEvents(pageNum) {
    const articles = await getPageArticles(pageNum);
    const events = [];

    for (let article of articles) {
        events.push({
            title: getTitle(article),
            venue: "Crazy Horse Saloon",
            city: "Nevada City",
            startDate: getStartDate(article),
            startTime: getStartTime(article),
            endTime: getEndTime(article),
            admission: getAdmission(article),
            url: getUrl(article),
        });
    }

    return events;
}

function getTitle(element) {
    const title = element.querySelector("h3 a");
    return title.textContent.trim();
}

function getStartDate(element) {
    const datetimeElement = element.querySelector(
        "time.tribe-events-pro-photo__event-date-tag-datetime",
    );
    const dateString = datetimeElement.getAttribute("datetime");
    return dateString;
}

function getTimes(element) {
    const selector = ".tribe-events-pro-photo__event-datetime";
    const timeString = element.querySelector(selector).textContent;
    const times = extractTimes(timeString);
    return times;
}

function getStartTime(element) {
    const times = getTimes(element);
    const startTime = formatTime(times[0]);
    return startTime;
}

function getEndTime(element) {
    const times = getTimes(element);
    const endTime = formatTime(times[1]);
    return endTime;
}

function getAdmission(element) {
    const price = element.querySelector(".tribe-events-c-small-cta__price");
    return price?.textContent.trim() || null;
}

function getUrl(element) {
    const selector = ".tribe-events-pro-photo__event-title-link";
    const url = element.querySelector(selector).href;
    return url;
}

export default getAllEvents;
