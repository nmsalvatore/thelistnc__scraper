import { months, formatTime, getUTCDateString } from "../utils/dates.js";
import jsdom from "jsdom";

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'The Center for the Arts' AND manual_upload = FALSE`;

    let events = [];
    let num = 1;
    let pageEvents;

    do {
        pageEvents = await getPageEvents(num);
        events = events.concat(pageEvents);
        num++;
    } while (pageEvents.length !== 0);

    const modifiedEvents = await getModifiedEvents(events, sql);
    const filteredEvents = events.filter((event) => {
        return filterOutModifiedEvents(event, modifiedEvents);
    });

    console.log(
        `Retrieved ${events.length} events from The Center for the Arts`,
    );
    return filteredEvents;
}

function filterOutModifiedEvents(event, modifiedEvents) {
    let duplicate;

    for (let modifiedEvent of modifiedEvents) {
        duplicate = checkDuplicate(modifiedEvent, event);
        if (duplicate) break;
    }

    if (!duplicate) {
        return event;
    }
}

function checkDuplicate(event1, event2) {
    const date1 = getUTCDateString(event1.start_date);
    const sameStartDate = date1 === event2.startDate;
    const sameTitle = event1.title === event2.title;
    return sameStartDate && sameTitle;
}

async function getModifiedEvents(events, sql) {
    const modifiedEvents = [];
    for (let event of events) {
        const dbEvent =
            await sql`SELECT title, start_date FROM events_event WHERE title = ${event.title} AND manual_upload = TRUE`;
        const dbTitle = await dbEvent[0]?.title;
        const dbStartDate = await dbEvent[0]?.start_date;

        if (dbTitle) {
            const dateString = getUTCDateString(dbStartDate);
            if (event.startDate === dateString) {
                modifiedEvents.push(dbEvent[0]);
            }
        }
    }
    return modifiedEvents;
}

async function getPageEventData(pageNum) {
    const response = await fetch("https://thecenterforthearts.org/events/", {
        credentials: "include",
        headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: `action=jet_engine_ajax&handler=listing_load_more&query%5Bpost_status%5D%5B%5D=publish&query%5Bpost_type%5D%5B%5D=events&query%5Bposts_per_page%5D=24&query%5Bpaged%5D=1&query%5Bignore_sticky_posts%5D=1&query%5Bmeta_query%5D%5Border_upnext%5D%5Bkey%5D=cfta_event_time_start&query%5Bmeta_query%5D%5Border_upnext%5D%5Bvalue%5D=1714574029&query%5Bmeta_query%5D%5Border_upnext%5D%5Bcompare%5D=%3E%3D&query%5Bmeta_query%5D%5Border_upnext%5D%5Btype%5D=NUMERIC&query%5Border%5D=ASC&query%5Borderby%5D=order_upnext&query%5Bsuppress_filters%5D=false&query%5Bjet_smart_filters%5D=jet-engine%2Fevent-filter&widget_settings%5Blisitng_id%5D=10816&page_settings%5Bqueried_id%5D=false&page_settings%5Belement_id%5D=false&page_settings%5Bpage%5D=${pageNum}`,
        method: "POST",
        mode: "cors",
    });

    const data = await response.json();
    return data;
}

function getDOM(html) {
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    return document;
}

function getEventContainers(document) {
    const containers = document.querySelectorAll(".jet-listing-grid__item");
    return containers;
}

async function getPageEvents(pageNum) {
    const data = await getPageEventData(pageNum);
    const html = await data.data.html;
    const document = getDOM(html);

    const events = [];

    const eventContainers = await getEventContainers(document);
    for (let containerElement of eventContainers) {
        const startDate = getStartDate(containerElement);

        events.push({
            title: getTitle(containerElement),
            venue: "The Center for the Arts",
            city: "Grass Valley",
            startDate: startDate,
            startTime: getStartTime(containerElement),
            endTime: null,
            admission: getAdmissionPrice(containerElement),
            url: getUrl(containerElement),
        });
    }

    return events;
}

function getTitle(containerElement) {
    const headingElement = containerElement.querySelector(
        ".elementor-element-5f281ef h2",
    );

    if (!headingElement) {
        throw new Error("Event title could not be retrieved");
    }

    const title = headingElement.textContent.trim();
    return title;
}

function getUrl(containerElement) {
    const linkElement = containerElement.querySelector(
        ".elementor-element-5f281ef h2 a",
    );

    if (!linkElement) {
        return null;
    }

    const url = linkElement.href;
    return url;
}

function getAdmissionPrice(containerElement) {
    const admissionElement = containerElement.querySelector(
        ".elementor-element-b12fd6b",
    );
    if (!admissionElement) {
        return null;
    }

    const admissionText = admissionElement.textContent.trim();
    const prices = matchPrices(admissionText);
    if (!prices) {
        return null;
    }

    const [minPrice, maxPrice] = getMinMaxPrices(prices);
    const priceString = formatPriceString(minPrice, maxPrice);
    return priceString;
}

function formatPriceString(minPrice, maxPrice) {
    if (minPrice === maxPrice) {
        return `$${minPrice}`;
    }
    return `$${minPrice}-$${maxPrice}`;
}

function getMinMaxPrices(prices) {
    const numericPrices = prices.map((price) => Number(price));
    const minPrice = Math.min(...numericPrices);
    const maxPrice = Math.max(...numericPrices);
    return [minPrice, maxPrice];
}

function matchPrices(text) {
    const regex = /\d+(?:\.\d+)?/g;
    const prices = text.match(regex);
    return prices;
}

function getStartDate(listing) {
    const month = getMonth(listing);
    const day = getDay(listing);
    const year = getYear(month, day);
    return `${year}-${month}-${day}`;
}

function getYear(month, day) {
    const year = new Date().getFullYear();
    const dateString = `${year}-${month}-${day}`;
    const date = new Date(dateString);
    const today = getToday();

    if (date < today) {
        return year + 1;
    }

    return year;
}

function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setHours(today.getHours() - 7);
    return today;
}

function getMonth(listing) {
    const selector =
        ".elementor-element-ebea841 .jet-listing-dynamic-field__content";
    const monthElement = listing.querySelector(selector);
    const monthName = monthElement.textContent.trim();

    if (!months.includes(monthName)) {
        throw new Error("Expected month value invalid");
    }

    return months.indexOf(monthName) + 1;
}

function getDay(listing) {
    const selector =
        ".elementor-element-c4167fb .jet-listing-dynamic-field__content";
    const dayElement = listing.querySelector(selector);
    const dayString = dayElement.textContent.trim();
    const day = Number(dayString);

    if (isNaN(day)) {
        throw new Error("Expected day value invalid");
    }

    return day;
}

function getStartTime(listing) {
    const selector =
        ".elementor-element-c96a95b .jet-listing-dynamic-field__content";
    const timeElement = listing.querySelector(selector);
    const timeString = timeElement.textContent.trim();
    const time = formatTime(timeString);
    return time;
}

export default getAllEvents;
