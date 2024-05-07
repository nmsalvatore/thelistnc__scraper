import fs from "node:fs";
import path from "path";

import { months, formatTime } from "../utils/dates.js";

import jsdom from "jsdom";
const { JSDOM } = jsdom;

async function getPageEvents(pageNum) {
    const response = await fetch(
        "https://thecenterforthearts.org/events/",
        {
            credentials: "include",
            headers: {
                Accept: "application/json, text/javascript, */*; q=0.01",
                "Accept-Language": "en-US,en;q=0.5",
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
            },
            body: `action=jet_engine_ajax&handler=listing_load_more&query%5Bpost_status%5D%5B%5D=publish&query%5Bpost_type%5D%5B%5D=events&query%5Bposts_per_page%5D=24&query%5Bpaged%5D=1&query%5Bignore_sticky_posts%5D=1&query%5Bmeta_query%5D%5Border_upnext%5D%5Bkey%5D=cfta_event_time_start&query%5Bmeta_query%5D%5Border_upnext%5D%5Bvalue%5D=1714574029&query%5Bmeta_query%5D%5Border_upnext%5D%5Bcompare%5D=%3E%3D&query%5Bmeta_query%5D%5Border_upnext%5D%5Btype%5D=NUMERIC&query%5Border%5D=ASC&query%5Borderby%5D=order_upnext&query%5Bsuppress_filters%5D=false&query%5Bjet_smart_filters%5D=jet-engine%2Fevent-filter&widget_settings%5Blisitng_id%5D=10816&page_settings%5Bqueried_id%5D=false&page_settings%5Belement_id%5D=false&page_settings%5Bpage%5D=${pageNum}`,
            method: "POST",
            mode: "cors",
        },
    );

    if (response.ok) {
        const data = await response.json();
        const html = data.data.html;
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const listings = document.querySelectorAll(
            ".jet-listing-grid__item",
        );

        const events = [];

        for (let listing of listings) {
            const datetime = getDateTime(listing);
            const startDate = datetime.toLocaleDateString();
            const startTime = datetime.toLocaleTimeString();
            const title = getTitle(listing);
            const venue = "The Center for the Arts";
            const city = "Grass Valley";
            const admission = getAdmission(listing);
            const url = getUrl(listing);

            events.push({
                title,
                startDate,
                startTime,
                venue,
                city,
                admission,
                url,
            });
        }

        return events;
    }
}

function getUrl(listing) {
    const element = listing.querySelector(
        ".elementor-element-5f281ef h2 a",
    );
    const url = element.href;
    return url;
}

function getTitle(listing) {
    const element = listing.querySelector(
        ".elementor-element-5f281ef h2",
    );
    if (!element) {
        throw new Error("Event title could not be retrieved");
    }
    const title = element.textContent.trim();
    return title;
}

function getAdmission(listing) {
    const element = listing.querySelector(
        ".elementor-element-b12fd6b",
    );
    if (!element) {
        return null;
    }
    const admission = element.textContent.trim();
    return admission;
}

function getDateTime(listing) {
    const month = getMonth(listing);
    const day = getDay(listing);
    const year = new Date().getFullYear();
    const time = getTime(listing);

    const now = new Date();
    const [hour, minutes] = time.split(":");
    const date = new Date(year, month, day, hour, minutes);

    if (date > now) {
        return date;
    }

    date.setFullYear(date + 1);
    return date;
}

function getMonth(listing) {
    const month = getFieldContent(listing, 1, 1);
    if (months.includes(month)) {
        return months.indexOf(month);
    } else {
        throw new Error("Expected month value invalid");
    }
}

function getDay(listing) {
    const day = +getFieldContent(listing, 1, 2);
    if (!isNaN(day)) {
        return day;
    } else {
        throw new Error("Expected day value invalid");
    }
}

function getTime(listing) {
    const fieldContent = getFieldContent(listing, 1, 3);
    const time = formatTime(fieldContent);
    return time;
}

function getFieldContent(
    listing,
    columnNum,
    elementNum,
    dynamicField = true,
    childSelector,
) {
    let selector = `.elementor-column:nth-child(${columnNum}) .elementor-element:nth-child(${elementNum})`;
    const dynamicFieldSelector =
        ".jet-listing-dynamic-field__content";

    if (dynamicField) {
        selector = `${selector} ${dynamicFieldSelector}`;
    }

    if (childSelector) {
        selector = `${selector} ${childSelector}`;
    }

    const field = listing.querySelector(selector);
    return field.textContent;
}

async function getEvents() {
    let events = [];
    let num = 1;
    let pageEvents;

    do {
        pageEvents = await getPageEvents(num);
        events = events.concat(pageEvents);
        num++;
    } while (pageEvents.length !== 0);

    return events;
}

const events = await getEvents();

fs.writeFile(
    path.join("..", "calendars", "centerforthearts.json"),
    JSON.stringify(events, null, 2),
    (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("File written succesfully");
        }
    },
);
