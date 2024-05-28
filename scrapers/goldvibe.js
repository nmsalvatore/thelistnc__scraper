import fs from "node:fs";
import path from "path";

async function getAllEvents(sql) {
    await sql`DELETE FROM events_event WHERE venue = 'Gold Vibe Kombuchary'`;

    let pageNum = 1;
    let nextPage;
    let events = [];

    do {
        const data = await getPageEventData(pageNum);
        const pageEvents = getPageEvents(data);
        nextPage = data.pages.nextPage;
        events = events.concat(pageEvents);
        pageNum++;
    } while (nextPage);

    return events;
}

async function getPageEventData(pageNum) {
    const response = await fetch(
        `https://api.eventcalendarapp.com/events?id=11497&page=${pageNum}`,
    );
    const data = response.json();
    return data;
}

function getPageEvents(data) {
    const events = [];

    for (let event of data.events) {
        events.push({
            title: getTitle(event),
            venue: "Gold Vibe Kombuchary",
            city: "Grass Valley",
            startDate: getStartDate(event),
            startTime: getStartTime(event),
            endTime: getEndTime(event),
            admission: getAdmissionPrice(event),
            url: getUrl(event),
            continuous: false,
        });
    }

    return events;
}

function getTitle(event) {
    return event.summary.trim();
}

function getStartDate(event) {
    const dateString = event.timezoneStart;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
    });
}

function getStartTime(event) {
    const dateString = event.timezoneStart;
    const time = getTime(dateString);
    return time;
}

function getEndTime(event) {
    const dateString = event.timezoneEnd;
    const time = getTime(dateString);
    return time;
}

function getTime(dateString) {
    const date = new Date(dateString);
    const time = date.toLocaleTimeString("en-US", { hour12: false });
    return time;
}

function getAdmissionPrice(event) {
    const text = event.description;
    if (!text) {
        return null;
    }

    const prices = matchPrices(text);
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
    const numericPrices = prices.map((price) => Number(price.slice(1)));
    const minPrice = Math.min(...numericPrices);
    const maxPrice = Math.max(...numericPrices);
    return [minPrice, maxPrice];
}

function matchPrices(text) {
    const regex = /\$\d+/g;
    const prices = text.match(regex);
    return prices;
}

function getUrl(event) {
    const url = event.ticketsLink;
    return url || "https://www.goldvibe.com/pages/schedule";
}

export default getAllEvents;
