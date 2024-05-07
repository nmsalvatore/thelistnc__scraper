import fs from "node:fs";
import path from "path";

async function getEventData(pageNum) {
    const response = await fetch(
        `https://api.eventcalendarapp.com/events?id=11497&page=${pageNum}&widgetUuid=100b29c5-2b2b-4c70-9ca7-95e6909dcc92`,
    );
    const data = response.json();
    return data;
}

function getPageEvents(data) {
    const pageEvents = data.events;
    const events = [];

    for (let pageEvent of pageEvents) {
        const startDatetime = new Date(pageEvent.timezoneStart);
        const endDatetime = new Date(pageEvent.timezoneEnd);
        const description = pageEvent.longDescription;
        events.push({
            title: pageEvent.summary,
            venue: "Gold Vibe Kombuchary",
            city: "Grass Valley",
            startDate: startDatetime.toLocaleDateString(),
            startTime: startDatetime.toLocaleTimeString(),
            endTime: endDatetime.toLocaleTimeString(),
            admission: getAdmissionPrice(description),
            url: pageEvent.ticketsLink,
        });
    }

    return events;
}

function getAdmissionPrice(text) {
    const regex = /\$\d+/g;
    const prices = text.match(regex);

    if (!prices) {
        return null;
    }

    const numericPrices = prices.map((price) => Number(price.slice(1)));
    const minPrice = Math.min(...numericPrices);
    const maxPrice = Math.max(...numericPrices);

    if (minPrice === maxPrice) {
        return `$${minPrice}`;
    } else {
        return `$${minPrice}-$${maxPrice}`;
    }
}

let pageNum = 1;
let nextPage;
let events = [];

do {
    const data = await getEventData(pageNum);
    const pageEvents = getPageEvents(data);
    nextPage = data.pages.nextPage;
    events = events.concat(pageEvents);
    pageNum++;
} while (nextPage);

fs.writeFile(
    path.join("..", "calendars", "goldvibe.json"),
    JSON.stringify(events, null, 2),
    (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("File written succesfully");
        }
    },
);
