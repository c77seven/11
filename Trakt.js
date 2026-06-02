WidgetMetadata = {
    id: "trakt_calendar_min",
    title: "Trakt 日历最小版",
    author: "Forward",
    description: "最小兼容版：内置 Client ID，只显示最近 7 天公开日历。",
    version: "1.0.0",
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
                        { title: "电影上映", value: "movies" }
                    ]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

const INTERNAL_CLIENT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

async function loadTraktCalendar(params = {}) {
    const section = params.section || "shows";
    const page = Number(params.page || 1);
    const startDate = new Date().toISOString().split("T")[0];
    const url = `https://api.trakt.tv/calendars/all/${section}/${startDate}/7?extended=full`;

    try {
        const res = await Widget.http.get(url, {
            headers: {
                "Content-Type": "application/json",
                "trakt-api-version": "2",
                "trakt-api-key": INTERNAL_CLIENT_ID
            }
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无日历数据" }] : [];

        const pageRows = rows.slice((page - 1) * 15, page * 15);
        const items = await Promise.all(pageRows.map(row => buildItem(row, section)));
        return items.filter(Boolean);
    } catch (e) {
        return [{ id: "err", type: "text", title: `读取失败: ${e.message || e}` }];
    }
}

async function buildItem(row, section) {
    const isMovie = section === "movies";
    const subject = isMovie ? row.movie : row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    const mediaType = isMovie ? "movie" : "tv";
    try {
        const d = await Widget.tmdb.get(`/${mediaType}/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
        const date = isMovie ? (row.released || d.release_date || "") : (row.first_aired || "");
        const ep = row.episode || {};
        const epText = isMovie ? "" : `${ep.season ? `S${ep.season}` : ""}${ep.number ? `E${ep.number}` : ""}`;

        return {
            id: String(d.id),
            tmdbId: d.id,
            type: "tmdb",
            mediaType: mediaType,
            title: d.name || d.title || subject.title,
            genreTitle: d.genres && d.genres.length > 0 ? d.genres[0].name : "影视",
            subTitle: "",
            releaseDate: [date ? date.substring(0, 10) : "", epText].filter(Boolean).join(" / "),
            year: date ? date.substring(0, 4) : "",
            posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "",
            description: d.overview || subject.overview || ""
        };
    } catch (e) {
        return null;
    }
}
