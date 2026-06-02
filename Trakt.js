WidgetMetadata = {
    id: "trakt_calendar_compat",
    title: "Trakt 日历兼容版",
    author: "Forward",
    description: "按常见可用脚本格式编写的 Trakt 公开日历模块，内置 Client ID，返回 TMDB 条目。",
    version: "1.0.2",
    requiredVersion: "0.0.1",
    site: "https://trakt.tv",
    modules: [
        {
            title: "Trakt 日历",
            functionName: "loadTraktCalendar",
            type: "list",
            cacheDuration: 1800,
            params: [
                {
                    name: "section",
                    title: "日历类型",
                    type: "enumeration",
                    value: "shows",
                    enumOptions: [
                        { title: "剧集日历", value: "shows" },
                        { title: "新剧日历", value: "shows/new" },
                        { title: "季首播", value: "shows/premieres" },
                        { title: "完结集", value: "shows/finales" },
                        { title: "电影上映", value: "movies" },
                        { title: "DVD 发行", value: "dvd" }
                    ]
                },
                {
                    name: "startDate",
                    title: "开始日期",
                    type: "input",
                    value: "",
                    placeholders: [{ title: "YYYY-MM-DD，留空为今天", value: "" }]
                },
                { name: "days", title: "天数", type: "count", value: 7 },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

const INTERNAL_CLIENT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

async function loadTraktCalendar(params = {}) {
    const section = params.section || "shows";
    const startDate = normalizeStartDate(params.startDate);
    const days = normalizeDays(params.days);
    const page = Number(params.page || 1);
    const url = `https://api.trakt.tv/calendars/all/${section}/${startDate}/${days}?extended=full`;

    try {
        const res = await Widget.http.get(url, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": INTERNAL_CLIENT_ID
            }
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) {
            return page === 1 ? [{ id: "empty", type: "text", title: "暂无日历数据" }] : [];
        }

        const start = (page - 1) * 20;
        const pageRows = rows.slice(start, start + 20);
        const items = await Promise.all(pageRows.map((row) => toCalendarItem(row, section)));
        const valid = items.filter(Boolean);

        if (valid.length === 0) {
            return page === 1 ? [{ id: "empty", type: "text", title: "暂无可显示的 TMDB 条目" }] : [];
        }

        return valid;
    } catch (error) {
        return [{ id: "err", type: "text", title: `读取 Trakt 失败: ${error.message || error}` }];
    }
}

async function toCalendarItem(row, section) {
    const isMovie = section === "movies" || section === "dvd";
    const subject = isMovie ? row.movie : row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    const mediaType = isMovie ? "movie" : "tv";
    const tmdb = await fetchTmdbDetail(subject.ids.tmdb, mediaType);
    if (!tmdb) return null;

    if (isMovie) {
        return movieItem(row, tmdb, section);
    }

    return showItem(row, tmdb, section);
}

async function fetchTmdbDetail(id, mediaType) {
    try {
        return await Widget.tmdb.get(`/${mediaType}/${id}`, { params: { language: "zh-CN" } });
    } catch (error) {
        return null;
    }
}

function showItem(row, tmdb, section) {
    const episode = row.episode || {};
    const airDate = dateOnly(row.first_aired || episode.first_aired);
    const year = airDate ? airDate.substring(0, 4) : dateOnly(tmdb.first_air_date).substring(0, 4);
    const episodeText = formatEpisode(episode);
    const genre = firstGenre(tmdb);

    return {
        id: String(tmdb.id),
        tmdbId: tmdb.id,
        type: "tmdb",
        mediaType: "tv",
        title: tmdb.name || row.show.title,
        genreTitle: genre,
        subTitle: "",
        releaseDate: compact([airDate, episodeText]).join(" / "),
        year: year,
        posterPath: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : "",
        description: compact([
            calendarTitle(section),
            episodeText,
            airDate ? `播出日期: ${airDate}` : "",
            episode.title ? `本集标题: ${episode.title}` : "",
            tmdb.overview || row.show.overview
        ]).join("\n")
    };
}

function movieItem(row, tmdb, section) {
    const releaseDate = dateOnly(row.released || tmdb.release_date);
    const year = releaseDate ? releaseDate.substring(0, 4) : "";
    const genre = firstGenre(tmdb);

    return {
        id: String(tmdb.id),
        tmdbId: tmdb.id,
        type: "tmdb",
        mediaType: "movie",
        title: tmdb.title || row.movie.title,
        genreTitle: genre,
        subTitle: "",
        releaseDate: releaseDate,
        year: year,
        posterPath: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : "",
        description: compact([
            calendarTitle(section),
            releaseDate ? `日期: ${releaseDate}` : "",
            tmdb.overview || row.movie.overview
        ]).join("\n")
    };
}

function calendarTitle(section) {
    if (section === "shows/new") return "新剧日历";
    if (section === "shows/premieres") return "季首播";
    if (section === "shows/finales") return "完结集";
    if (section === "movies") return "电影上映";
    if (section === "dvd") return "DVD 发行";
    return "剧集日历";
}

function formatEpisode(episode) {
    if (!episode) return "";
    const season = episode.season != null ? `S${episode.season}` : "";
    const number = episode.number != null ? `E${episode.number}` : "";
    return compact([`${season}${number}`, episode.title]).join(" ");
}

function firstGenre(tmdb) {
    return tmdb.genres && tmdb.genres.length > 0 ? tmdb.genres[0].name : "影视";
}

function normalizeStartDate(value) {
    const text = clean(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    return new Date().toISOString().split("T")[0];
}

function normalizeDays(value) {
    const days = Number(value || 7);
    if (!Number.isFinite(days)) return 7;
    return Math.max(1, Math.min(33, Math.floor(days)));
}

function dateOnly(value) {
    const text = clean(value);
    return text ? text.slice(0, 10) : "";
}

function clean(value) {
    return value == null ? "" : String(value).trim();
}

function compact(values) {
    return values.filter((value) => value !== undefined && value !== null && String(value).trim() !== "");
}
