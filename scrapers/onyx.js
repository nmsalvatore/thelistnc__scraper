async function getSchedule() {
    const movieIdsAsString = await getMovieIdsAsString();
    const startDate = getStartDate();
    const endDate = getEndDate();

    const response = await fetch(
        "https://www.theonyxtheatre.com/api/gatsby-source-boxofficeapi/schedule",
        {
            credentials: "include",
            referrer: "https://www.theonyxtheatre.com/showtimes/",
            body: `{"circuit":null,"theaters":[{"id":"X065X","timeZone":"America/Los_Angeles"}],"movieIds":${movieIdsAsString},"from":"${startDate}","to":"${endDate}","nin":[],"sin":[],"websiteId":"V2Vic2l0ZU1hbmFnZXJXZWJzaXRlOjhmNzhiNTE3LTlhZjUtNDEzZi04ZWU0LWVjYzNlNmI3NmI0Zg=="}`,
            method: "POST",
            mode: "cors",
        },
    );

    const data = await response.json();
    const dates = await data.X065X.schedule;
    return dates;
}

async function getOnyxShowings() {
    const schedule = await getSchedule();
    const showings = [];

    for (const id in schedule) {
        const movieShowtimesByDate = await schedule[id];

        for (const movieDate in movieShowtimesByDate) {
            const daysMovieShowtimeData = await movieShowtimesByDate[movieDate];

            for (const showtimeData of daysMovieShowtimeData) {
                const isNevadaTheatre =
                    await checkIfNevadaTheatre(showtimeData);

                if (isNevadaTheatre) {
                    const title = await getMovieTitleById(id);
                    const venue = "Nevada Theatre";
                    const city = "Nevada City";
                    const startTime = await getMovieTime(showtimeData);
                    const startDate = movieDate;
                    const endTime = null;
                    const admission = null;
                    const url = await getShowingUrl(showtimeData);

                    const showing = {
                        title,
                        venue,
                        city,
                        startDate,
                        startTime,
                        endTime,
                        admission,
                        url,
                    };

                    showings.push(showing);
                }
            }
        }
    }

    return showings;
}

async function getMovieNodes() {
    const response = await fetch(
        "https://www.theonyxtheatre.com/page-data/sq/d/1945441818.json",
    );
    const data = await response.json();
    const nodes = await data.data.allMovie.nodes;
    return nodes;
}

async function getMovieIds() {
    const nodes = await getMovieNodes();
    const ids = await nodes.map((node) => node.id);
    return ids;
}

async function getMovieIdsAsString() {
    const ids = await getMovieIds();
    const idsAsString = JSON.stringify(ids);
    return idsAsString;
}

async function getMovieInfoById(id) {
    const nodes = await getMovieNodes();

    for (const node of nodes) {
        if (node.id === id) {
            return node;
        }
    }

    throw Error(`Could not find movie with id ${id}`);
}

async function getMovieTitleById(id) {
    const info = await getMovieInfoById(id);
    const title = "The Onyx Downtown Presents: " + info.title;
    return title;
}

async function getShowingUrl(data) {
    const url = data.data.ticketing[0].urls[0];
    return url;
}

async function checkIfNevadaTheatre(data) {
    const tags = await data.tags;
    return tags[0] === "Auditorium.Experience.TraditionalAuditorium";
}

async function getMovieTime(data) {
    const time = await data.startsAt.split("T")[1];
    return time;
}

function getTodayFormatted() {
    const date = new Date();
    const today = date.toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
    });
    return today;
}

function getStartDate() {
    const today = getTodayFormatted();
    const [month, day, year] = today.split("/");
    const startDate = `${year}-${month}-${day}T03:00:00`;
    return startDate;
}

function getEndDate() {
    const today = getTodayFormatted();
    const [month, day, year] = today.split("/");
    const nextYear = Number(year) + 1;
    const endDate = `${nextYear}-${month}-${day}T03:00:00`;
    return endDate;
}

export default getOnyxShowings;
