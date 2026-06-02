WidgetMetadata = {
    id: "trakt_calendar_badge",
    title: "Trakt 日历角标版",
    author: "Forward",
    description: "固定灰色圆角图片角标版，参数保持最少。",
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
                {
                    name: "cloudinaryCloud",
                    title: "Cloudinary Cloud",
                    type: "input",
                    value: "",
                    placeholders: [{ title: "必填：Cloudinary cloud name", value: "" }]
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
    const cloud = clean(params.cloudinaryCloud);

    if (section === "personal") {
        return await loadPersonalCalendar(params.traktUser, page, cloud);
    }

    return await loadPublicCalendar(section, page, cloud);
}

async function loadPersonalCalendar(user, page, cloud) {
    const traktUser = clean(user);
    if (!traktUser) return [{ id: "need_user", type: "text", title: "请填写 Trakt 用户名" }];
    if (!cloud) return [{ id: "need_cloud", type: "text", title: "请填写 Cloudinary Cloud" }];

    const url = `https://api.trakt.tv/users/${encodeURIComponent(traktUser)}/watched/shows?extended=noseasons&limit=100`;

    try {
        const res = await Widget.http.get(url, { headers: traktHeaders() });
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无观看记录" }] : [];

        const enriched = await Promise.all(rows.slice(0, 80).map(row => buildPersonalItem(row, cloud)));
        const valid = enriched.filter(Boolean);
        sortPersonalItems(valid);

        const pageItems = valid.slice((page - 1) * 15, page * 15);
        return pageItems.length > 0 ? pageItems : (page === 1 ? [{ id: "empty", type: "text", title: "暂无可显示剧集" }] : []);
    } catch (e) {
        return [{ id: "err", type: "text", title: `读取个人日历失败: ${e.message || e}` }];
    }
}

async function loadPublicCalendar(section, page, cloud) {
    if (!cloud) return [{ id: "need_cloud", type: "text", title: "请填写 Cloudinary Cloud" }];

    const url = `https://api.trakt.tv/calendars/all/${section}/${todayDate()}/7?extended=full`;

    try {
        const res = await Widget.http.get(url, { headers: traktHeaders() });
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length === 0) return page === 1 ? [{ id: "empty", type: "text", title: "暂无日历数据" }] : [];

        const pageRows = rows.slice((page - 1) * 15, page * 15);
        const items = await Promise.all(pageRows.map(row => buildPublicItem(row, section, cloud)));
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

async function buildPersonalItem(row, cloud) {
    const subject = row && row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    try {
        const d = await Widget.tmdb.get(`/tv/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
        const ep = d.next_episode_to_air || d.last_episode_to_air || null;
        const airDate = ep && ep.air_date ? ep.air_date : (d.first_air_date || "");
        return {
            sortDate: airDate || "1970-01-01",
            isFuture: isTodayOrFuture(airDate),
            item: buildShowItem(d, subject, ep, airDate, row.last_watched_at || "", "我的追剧日历", cloud)
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

async function buildPublicItem(row, section, cloud) {
    const isMovie = section === "movies";
    const subject = isMovie ? row.movie : row.show;
    if (!subject || !subject.ids || !subject.ids.tmdb) return null;

    const mediaType = isMovie ? "movie" : "tv";

    try {
        const d = await Widget.tmdb.get(`/${mediaType}/${subject.ids.tmdb}`, { params: { language: "zh-CN" } });
        if (isMovie) return buildMovieItem(d, subject, row.released || d.release_date, calendarTitle(section), cloud);
        return buildShowItem(d, subject, row.episode || null, row.first_aired || "", "", calendarTitle(section), cloud);
    } catch (e) {
        return null;
    }
}

function buildShowItem(d, fallback, ep, airDate, watchedDate, sourceTitle, cloud) {
    const badgeText = formatOverlayTime(airDate);
    const dateText = formatPosterUpdateDate(airDate, ep);
    const episodeText = formatEpisodeText(ep);
    const episodeTitle = ep && ep.name ? ep.name : (ep && ep.title ? ep.title : "");
    const image = tmdbImage(d.backdrop_path || d.poster_path, "w780");
    const fallbackPoster = tmdbImage(d.poster_path || d.backdrop_path, "w500");
    const poster = overlayImageUrl(image || fallbackPoster, badgeText, cloud);
    const seasonNumber = ep && (ep.season_number || ep.season);
    const episodeNumber = ep && (ep.episode_number || ep.number);

    return {
        id: String(d.id),
        link: `trakt-badge:tv:${d.id}:${seasonNumber || ""}:${episodeNumber || ""}`,
        tmdbId: d.id,
        type: "url",
        mediaType: "tv",
        title: d.name || fallback.title,
        seriesName: d.name || fallback.title,
        season: seasonNumber,
        episode: episodeNumber,
        episodeName: episodeTitle,
        genreTitle: firstGenre(d),
        subTitle: "",
        releaseDate: episodeText,
        year: airDate ? airDate.substring(0, 4) : "",
        durationText: badgeText,
        posterPath: poster || fallbackPoster,
        backdropPath: poster || image || fallbackPoster,
        description: compact([
            sourceTitle,
            dateText ? `更新时间: ${dateText}` : "",
            episodeTitle ? `本集标题: ${episodeTitle}` : "",
            watchedDate ? `上次观看: ${watchedDate.split("T")[0]}` : "",
            d.overview || fallback.overview || ""
        ]).join("\n")
    };
}

function buildMovieItem(d, fallback, releaseDate, sourceTitle, cloud) {
    const date = clean(releaseDate).slice(0, 10);
    const badgeText = formatOverlayTime(date);
    const image = tmdbImage(d.backdrop_path || d.poster_path, "w780");
    const fallbackPoster = tmdbImage(d.poster_path || d.backdrop_path, "w500");
    const poster = overlayImageUrl(image || fallbackPoster, badgeText, cloud);

    return {
        id: String(d.id),
        link: `trakt-badge:movie:${d.id}`,
        tmdbId: d.id,
        type: "url",
        mediaType: "movie",
        title: d.title || fallback.title,
        genreTitle: firstGenre(d),
        subTitle: "",
        releaseDate: "",
        year: date ? date.substring(0, 4) : "",
        durationText: badgeText,
        posterPath: poster || fallbackPoster,
        backdropPath: poster || image || fallbackPoster,
        description: compact([
            sourceTitle,
            date ? `上映日期: ${date}` : "",
            d.overview || fallback.overview || ""
        ]).join("\n")
    };
}

async function loadDetail(link) {
    const parts = String(link || "").split(":");
    if (parts[0] !== "trakt-badge" || parts.length < 3) return null;

    const mediaType = parts[1] === "movie" ? "movie" : "tv";
    const tmdbId = parts[2];
    const season = parts[3] ? Number(parts[3]) : undefined;
    const episode = parts[4] ? Number(parts[4]) : undefined;

    try {
        const d = await Widget.tmdb.get(`/${mediaType}/${tmdbId}`, { params: { language: "zh-CN" } });
        return {
            id: Number(d.id),
            tmdbId: Number(d.id),
            type: "tmdb",
            mediaType: mediaType,
            title: mediaType === "movie" ? d.title : d.name,
            seriesName: mediaType === "movie" ? "" : d.name,
            season: season,
            episode: episode,
            posterPath: tmdbImage(d.poster_path, "w500"),
            backdropPath: tmdbImage(d.backdrop_path || d.poster_path, "w780"),
            releaseDate: mediaType === "movie" ? (d.release_date || "") : (d.first_air_date || ""),
            genreTitle: firstGenre(d),
            description: d.overview || ""
        };
    } catch (e) {
        return null;
    }
}

function overlayImageUrl(imageUrl, badgeText, cloud) {
    const image = clean(imageUrl);
    const text = clean(badgeText);
    const cloudName = clean(cloud);
    if (!cloudName || !image || !text) return image;

    const safeCloud = encodeURIComponent(cloudName);
    const safeText = encodeURIComponent(text);
    const safeImage = encodeURIComponent(image);
    const transform = [
        "c_fill,w_780,h_438,g_auto,q_auto,f_auto",
        `l_text:Arial_52_bold:${safeText},co_rgb:FFFFFF,b_rgb:6B7280,bo_18px_solid_rgb:6B7280,r_24`,
        "fl_layer_apply,g_south_west,x_28,y_28"
    ].join("/");

    return `https://res.cloudinary.com/${safeCloud}/image/fetch/${transform}/${safeImage}`;
}

function tmdbImage(path, size) {
    const text = clean(path);
    if (!text) return "";
    if (text.indexOf("http") === 0) return text;
    return `https://image.tmdb.org/t/p/${size}${text}`;
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
            if (diffMs >= 0 && diffHours < 24) return diffHours <= 0 ? "即将播出" : `${diffHours}小时后`;
            if (diffMs < 0 && Math.abs(diffHours) < 24) return `${Math.abs(diffHours)}小时前`;
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
    return cleanDate >= todayDate();
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
    return values.filter(value => value !== undefined && value !== null && String(value).trim() !== "");
}
