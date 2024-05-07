import fs from "node:fs";
import path from "path";

import jsdom from "jsdom";
import got from "got";

import { extractTimes } from "../utils/dates.js";

const { JSDOM } = jsdom;

async function getPageDocument(pageNum) {
    const response = await fetch(
        `https://crazyhorsenc.com/shows/photo/page/${pageNum}/`,
    );

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return document;
}

async function getPageEvents(pageNum) {
    const pageDocument = await getPageDocument(pageNum);
    const articles = pageDocument.querySelectorAll(
        "article.tribe-common-g-col",
    );

    const events = [];

    for (let article of articles) {
        const title = getTitle(article);
        const date = getDate(article);
        const admission = getAdmission(article);
        const venue = "Crazy Horse Saloon";
        const city = "Nevada City";
        const times = getTimes(article);
        const startTime = times[0];
        const endTime = times[1];
        const url = getUrl(article);

        events.push({
            title,
            venue,
            city,
            date,
            startTime,
            endTime,
            admission,
            url,
        });
    }

    return events;
}

function getTitle(element) {
    const title = element.querySelector("h3 a");
    return title.textContent.trim();
}

function getDate(element) {
    const time = element.querySelector(
        "time.tribe-events-pro-photo__event-date-tag-datetime",
    );
    return time.getAttribute("datetime");
}

function getTimes(element) {
    const selector = ".tribe-events-pro-photo__event-datetime";
    const timeString =
        element.querySelector(selector).textContent;
    const times = extractTimes(timeString);
    return times;
}

function getAdmission(element) {
    const price = element.querySelector(
        ".tribe-events-c-small-cta__price",
    );
    return price.textContent.trim();
}

function getUrl(element) {
    const selector =
        ".tribe-events-pro-photo__event-title-link";
    const url = element.querySelector(selector).href;
    return url;
}

let pageNum = 1;
let pageEvents;
let events = [];

do {
    pageEvents = await getPageEvents(pageNum);
    events = events.concat(pageEvents);
    pageNum++;
} while (pageEvents.length > 0);

fs.writeFile(
    path.resolve("..", "calendars", "crazyhorse.json"),
    JSON.stringify(events, null, 2),
    (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("File written successfully.");
        }
    },
);
