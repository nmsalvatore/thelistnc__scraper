import fs from "node:fs";
import path from "path";

async function getEventData(pageNum) {
    const response = await fetch(
        "https://google-calendar.galilcloud.wixapps.net/_api/getEvents?compId=comp-lrsbhlif&instance=wIl7qncBWVVwqoyjif04yaViIeTe-4dh6vifqlt8GSE.eyJpbnN0YW5jZUlkIjoiMjg5YjA3MjgtYTY0NC00YzA0LWJhMDUtNmZlMjk5MDBmMWFiIiwiYXBwRGVmSWQiOiIxMjlhY2I0NC0yYzhhLTgzMTQtZmJjOC03M2Q1Yjk3M2E4OGYiLCJtZXRhU2l0ZUlkIjoiOTM3MDZhZDItNzYzYy00ZDkwLTg2ZjgtNmQ3ZWY2MWVhZjcyIiwic2lnbkRhdGUiOiIyMDI0LTA1LTA1VDE1OjQyOjIzLjQzMloiLCJkZW1vTW9kZSI6ZmFsc2UsImFpZCI6ImRmNDUzMzBkLTg0OTQtNDEwNi04MjdiLTJkZGRmZGI0NzI0MyIsImJpVG9rZW4iOiJiYmViNmRmYS1kMDc4LTAxOTQtM2NmZC0wMjljNmYxZTVlZDkiLCJzaXRlT3duZXJJZCI6ImVlMmQ4OGUzLTc0NjAtNDllMC1hOWM3LTFjOGRkZjM0MmY0YSJ9",
    );
    const data = await response.json();
    return data;
}

const data = await getEventData();
const eventDates = Object.keys(data.eventsByDates);
const allEvents = [];

for (let eventDate of eventDates) {
    const daysEvents = data.eventsByDates[eventDate];

    for (let daysEvent of daysEvents) {
        const date = new Date(daysEvent.startDate);
        allEvents.push({
            date,
            title: daysEvent.title,
            venue: "Wild Eye Pub",
            city: "Grass Valley",
            startDate: date.toLocaleDateString(),
            startTime: date.toLocaleTimeString(),
        });
    }
}

const now = new Date();
const filteredEvents = allEvents.filter((event) => event.date > now);
const sortedEvents = filteredEvents.sort((a, b) => a.date - b.date);
const events = sortedEvents.map(({ date, ...rest }) => rest);

fs.writeFile(
    path.join("..", "calendars", "wildeye.json"),
    JSON.stringify(events, null, 2),
    (err) => {
        if (err) {
            console.error(err);
        } else {
            console.log("File written succesfully");
        }
    },
);
