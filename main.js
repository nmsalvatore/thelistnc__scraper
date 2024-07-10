import getGoldVibeEvents from "./scrapers/goldvibe.js";
import getCrazyHorseEvents from "./scrapers/crazyhorse.js";
import getElixartEvents from "./scrapers/elixart.js";
import getCFTAEvents from "./scrapers/centerforthearts.js";
import getGoldenEraEvents from "./scrapers/goldenera.js";
import getLucchesiEvents from "./scrapers/lucchesi.js";
import getNevadaTheatreEvents from "./scrapers/nevadatheatre.js";

import sql from "./db.js";
import { v4 as uuid4 } from "uuid";

try {
    await sql.begin(async (sql) => {
        const events = await getAllEvents(sql);
        await insertEventData(sql, events);
        console.log(`${events.length} events successfully added to database`);
    });
} catch (error) {
    console.error("Scraper error:", error);
} finally {
    await sql.end();
}

async function insertEventData(sql, events) {
    for (let event of events) {
        try {
            await sql`INSERT INTO events_event ${sql({
                uuid: uuid4(),
                created_at: sql`now()`,
                updated_at: sql`now()`,
                title: event.title,
                venue: event.venue,
                city: event.city,
                start_date: event.startDate,
                start_time: event.startTime,
                end_time: event.endTime,
                admission_price: event.admission,
                url: event.url,
                continuous: false,
                manual_upload: false,
            })}`;
        } catch (error) {
            throw Error(error);
        }
    }
}

async function getAllEvents(sql) {
    let events = [];

    const goldVibeEvents = await getGoldVibeEvents(sql);
    const crazyHorseEvents = await getCrazyHorseEvents(sql);
    const elixartEvents = await getElixartEvents(sql);
    const centerEvents = await getCFTAEvents(sql);
    const goldenEraEvents = await getGoldenEraEvents(sql);
    const lucchesiEvents = await getLucchesiEvents(sql);
    const nevadaTheatreEvents = await getNevadaTheatreEvents(sql);

    events = events.concat(
        goldVibeEvents,
        crazyHorseEvents,
        elixartEvents,
        centerEvents,
        goldenEraEvents,
        lucchesiEvents,
        nevadaTheatreEvents,
    );

    return events;
}
