WidgetMetadata = {
    id: "trakt_calendar_personal_min",
    title: "Trakt 个人日历最小版",
    author: "Forward",
    description: "最小兼容版：内置 Client ID，支持个人追剧日历和公开日历，并在卡片日期位置显示更新时间。",
    version: "1.1.0",
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
                    value: "personal",
                    enumOptions: [
                        { title: "我的追剧日历", value: "personal" },
                        { title: "公开剧集日历", value: "shows" },
                        { title: "新剧日历", value: "shows/new" },
                        { title: "季首播", value: "shows/premieres" },
                        { title: "电影上映", value: "movies" }
                    ]
                },
                {
                    name: "traktUser",
                    title: "Trakt 用户名",
                    type: "input",
                    value: "",
                    placeholders: [{ title: "我的追剧日历需要填写用户名", value: "" }]
                },
                { name: "page", title: "页码", type: "page" }
            ]
        }
    ]
};

const INTERNAL_CLIENT_ID = "95b59922670c84040db3632c7aac6f33704f6ffe5cbf3113a056e37cb45cb482";

async function loadTraktCalendar(params = {}) {
    const section = params.section || "personal";
    const page = Number(params.page || 1);

    if (section === "personal") {
        return await loadPersonalCalendar(params.traktUser, page);
    }

    return await loadPublicCalendar(section, page);
}

async function loadPersonalCalendar(user, page) {
    const traktUser = clean(user);
    if (!traktUser) {
        return [{ id: "need_user", type: "text", title: "请填写 Trakt 用户名" }];
    }

    const url = `https://api.trakt.tv/users/${encodeURIComponent(traktUser)}/watched/shows?extended=noseasons&limit=100`;

    try {
        const res = await Widget.http.get(url, {
            headers: traktHeaders()
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无观看记录" }] : [];

        const enriched = await Promise.all(rows.slice(0, 80).map(buildPersonalItem));
        const valid = enriched.filter(Boolean);
        sortPersonalItems(valid);

        const pageItems = valid.slice((page - 1) * 15, page * 15);
        if (pageItems.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无可显示剧集" }] : [];
        return pageItems;
    } catch (e) {
        return [{ id: "err", type: "text", title: `读取个人日历失败: ${e.message || e}` }];
    }
}

async function loadPublicCalendar(section, page) {
    const startDate = todayDate();
    const url = `https://api.trakt.tv/calendars/all/${section}/${startDate}/7?extended=full`;

    try {
        const res = await Widget.http.get(url, {
            headers: traktHeaders()
        });

        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无日历数据" }] : [];

        const pageRows = rows.slice((page - 1) * 15, page * 15);
        const items = await Promise.all(pageRows.map(row => buildPublicItem(row, section)));
        const valid = items.filter(Boolean);
        return valid.length > 0 ? valid : (page === 1 ? [{ id: "empty", type: "text", title: "暂无可显示条目" }] : []);
    } catch (e) {
        return [{ id: "err", type: "text", title: `读取公开日历失败: ${e.message || e}` }];
    }
}

function traktHeaders() {
    return {
        "Content-Type": "application/json",
        "trakt-api-version": "2",
        "trakt-api-key": INTERNAL_CLIENT_ID
    };
}

async function buildPersonalItem(row) {
    const subject = row && row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    try {
        const d = await Widget.tmdb.get(`/tv/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
        const ep = d.next_episode_to_air || d.last_episode_to_air || null;
        const airDate = ep && ep.air_date ? ep.air_date : (d.first_air_date || "");
        const isFuture = isTodayOrFuture(airDate);

        return {
            sortDate: airDate || "1970-01-01",
            isFuture: isFuture,
            watchedDate: row.last_watched_at || "",
            item: buildShowVideoItem(d, subject, ep, airDate, row.last_watched_at, "我的追剧日历")
        };
    } catch (e) {
        return null;
    }
}

function sortPersonalItems(items) {
    items.sort((a, b) => {
        if (a.isFuture !== b.isFuture) return a.isFuture ? -1 : 1;
        if (a.isFuture) return new Date(a.sortDate) - new Date(b.sortDate);
        return new Date(b.sortDate) - new Date(a.sortDate);
    });

    for (let i = 0; i < items.length; i++) {
        items[i] = items[i].item;
    }
}

async function buildPublicItem(row, section) {
    const isMovie = section === "movies";
    const subject = isMovie ? row.movie : row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    const mediaType = isMovie ? "movie" : "tv";

    try {
        const d = await Widget.tmdb.get(`/${mediaType}/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
        if (isMovie) {
            return buildMovieVideoItem(d, subject, row.released || d.release_date, calendarTitle(section));
        }

        const ep = row.episode || null;
        return buildShowVideoItem(d, subject, ep, row.first_aired || "", "", calendarTitle(section));
    } catch (e) {
        return null;
    }
}

function buildShowVideoItem(d, fallback, ep, airDate, watchedDate, sourceTitle) {
    const dateText = formatPosterUpdateDate(airDate, ep);
    const badgeText = formatOverlayTime(airDate);
    const episodeText = formatEpisodeText(ep);
    const genre = firstGenre(d);
    const episodeTitle = ep && ep.name ? ep.name : (ep && ep.title ? ep.title : "");

    return {
        id: String(d.id),
        tmdbId: d.id,
        type: "tmdb",
        mediaType: "tv",
        title: d.name || fallback.title,
        genreTitle: genre,
        subTitle: "",
        releaseDate: episodeText,
        year: airDate ? airDate.substring(0, 4) : "",
        durationText: badgeText,
        posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "",
        description: compact([
            sourceTitle,
            dateText ? `更新时间: ${dateText}` : "",
            episodeTitle ? `本集标题: ${episodeTitle}` : "",
            watchedDate ? `上次观看: ${watchedDate.split("T")[0]}` : "",
            d.overview || fallback.overview || ""
        ]).join("\n")
    };
}

function buildMovieVideoItem(d, fallback, releaseDate, sourceTitle) {
    const date = clean(releaseDate).slice(0, 10);
    const badgeText = formatOverlayTime(date);
    const genre = firstGenre(d);

    return {
        id: String(d.id),
        tmdbId: d.id,
        type: "tmdb",
        mediaType: "movie",
        title: d.title || fallback.title,
        genreTitle: genre,
        subTitle: "",
        releaseDate: "",
        year: date ? date.substring(0, 4) : "",
        durationText: badgeText,
        posterPath: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : "",
        description: compact([
            sourceTitle,
            date ? `上映日期: ${date}` : "",
            d.overview || fallback.overview || ""
        ]).join("\n")
    };
}

function calendarTitle(section) {
    if (section === "shows/new") return "新剧日历";
    if (section === "shows/premieres") return "季首播";
    if (section === "movies") return "电影上映";
    return "公开剧集日历";
}

function formatPosterUpdateDate(date, ep) {
    const cleanDate = clean(date).slice(0, 10);
    if (!cleanDate) return "";

    const year = cleanDate.substring(0, 4);
    const month = Number(cleanDate.substring(5, 7));
    const day = Number(cleanDate.substring(8, 10));
    const season = ep && (ep.season_number || ep.season);
    const episode = ep && (ep.episode_number || ep.number);
    const episodeText = season || episode ? `S${season || "?"}•E${episode || "?"}` : "";

    return compact([year, episodeText, `${month}.${day}`]).join("/");
}

function formatMovieDate(date) {
    const cleanDate = clean(date).slice(0, 10);
    if (!cleanDate) return "";

    const year = cleanDate.substring(0, 4);
    const month = Number(cleanDate.substring(5, 7));
    const day = Number(cleanDate.substring(8, 10));
    return `${year}/${month}.${day}`;
}

function formatEpisodeText(ep) {
    if (!ep) return "";

    const season = ep.season_number || ep.season;
    const episode = ep.episode_number || ep.number;
    const title = ep.name || ep.title || "";
    const code = season || episode ? `S${season || "?"}•E${episode || "?"}` : "";
    return compact([code, title]).join(" - ");
}

function formatOverlayTime(value) {
    const text = clean(value);
    if (!text) return "";

    const hasTime = text.indexOf("T") > -1;
    const dateText = text.slice(0, 10);

    if (hasTime) {
        const target = new Date(text);
        if (!isNaN(target.getTime())) {
            const diffMs = target.getTime() - new Date().getTime();
            const diffHours = Math.round(diffMs / 3600000);
            if (diffMs >= 0 && diffHours < 24) {
                return diffHours <= 0 ? "即将播出" : `${diffHours}小时后`;
            }
            if (diffMs < 0 && Math.abs(diffHours) < 24) {
                return `${Math.abs(diffHours)}小时前`;
            }
        }
    }

    const dayDiff = daysBetween(todayDate(), dateText);
    if (dayDiff === 0) return "今天";
    if (dayDiff === 1) return "明天";
    if (dayDiff === 2) return "后天";
    if (dayDiff > 2) return `${dayDiff}天后`;
    if (dayDiff === -1) return "昨天";
    if (dayDiff < -1) return `${Math.abs(dayDiff)}天前`;
    return "";
}

function daysBetween(startDate, endDate) {
    const start = parseLocalDate(startDate);
    const end = parseLocalDate(endDate);
    if (!start || !end) return 0;
    return Math.round((end.getTime() - start.getTime()) / 86400000);
}

function parseLocalDate(dateText) {
    const text = clean(dateText).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
    const parts = text.split("-");
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function isTodayOrFuture(date) {
    const cleanDate = clean(date).slice(0, 10);
    if (!cleanDate) return false;
    const today = todayDate();
    return cleanDate >= today;
}

function todayDate() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function firstGenre(d) {
    return d.genres && d.genres.length > 0 ? d.genres[0].name : "影视";
}

function clean(value) {
    return value == null ? "" : String(value).trim();
}

function compact(values) {
    return values.filter((value) => value !== undefined && value !== null && String(value).trim() !== "");
}
