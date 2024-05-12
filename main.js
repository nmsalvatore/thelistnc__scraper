import getGoldVibeEvents from "./scrapers/goldvibe.js";
import getCrazyHorseEvents from "./scrapers/crazyhorse.js";
import getElixartEvents from "./scrapers/elixart.js";

import sql from "./db.js";
import { v4 as uuid4 } from "uuid";

try {
    const events = await getAllEvents();

    for (let event of events) {
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
            continuous: event.continuous,
        })}`;
    }

    console.log(`${events.length} events successfully added to database`);
} catch (err) {
    console.error(err);
}

async function getAllEvents() {
    let events = [];

    const goldVibeEvents = await getGoldVibeEvents();
    const crazyHorseEvents = await getCrazyHorseEvents();
    const elixartEvents = await getElixartEvents();

    events = events.concat(goldVibeEvents, crazyHorseEvents, elixartEvents);
    return events;
}

sql.end();
