WidgetMetadata = {
  id: "forward.trakt.calendar",
  title: "Trakt 日历",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  description: "获取 Trakt 公开/个人日历数据，按日期返回剧集、首播、新剧、完结集、电影和 DVD 发行。",
  author: "Forward",
  site: "https://trakt.tv",
  detailCacheDuration: 3600,
  globalParams: [
    {
      name: "traktClientId",
      title: "Trakt Client ID",
      type: "input",
      placeholders: [{ title: "在 Trakt API app 页面复制 Client ID", value: "" }],
    },
    {
      name: "calendarTarget",
      title: "日历范围",
      type: "enumeration",
      value: "all",
      enumOptions: [
        { title: "公开日历", value: "all" },
        { title: "我的日历", value: "my" },
      ],
    },
    {
      name: "traktAccessToken",
      title: "OAuth Token",
      type: "input",
      belongTo: { paramName: "calendarTarget", value: ["my"] },
      placeholders: [{ title: "个人 my 日历需要 Bearer access token", value: "" }],
    },
    {
      name: "extended",
      title: "扩展信息",
      type: "enumeration",
      value: "full",
      enumOptions: [
        { title: "完整", value: "full" },
        { title: "最小", value: "minimal" },
      ],
    },
  ],
  modules: [
    {
      id: "traktShows",
      title: "剧集日历",
      functionName: "loadTraktShows",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
        {
          name: "networks",
          title: "电视网",
          type: "input",
          placeholders: [{ title: "可选，如 HBO,Netflix", value: "" }],
        },
      ],
    },
    {
      id: "traktNewShows",
      title: "新剧日历",
      functionName: "loadTraktNewShows",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
        {
          name: "networks",
          title: "电视网",
          type: "input",
          placeholders: [{ title: "可选，如 HBO,Netflix", value: "" }],
        },
      ],
    },
    {
      id: "traktSeasonPremieres",
      title: "季首播",
      functionName: "loadTraktSeasonPremieres",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
        {
          name: "networks",
          title: "电视网",
          type: "input",
          placeholders: [{ title: "可选，如 HBO,Netflix", value: "" }],
        },
      ],
    },
    {
      id: "traktFinales",
      title: "完结集",
      functionName: "loadTraktFinales",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
        {
          name: "networks",
          title: "电视网",
          type: "input",
          placeholders: [{ title: "可选，如 HBO,Netflix", value: "" }],
        },
      ],
    },
    {
      id: "traktMovies",
      title: "电影上映",
      functionName: "loadTraktMovies",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
      ],
    },
    {
      id: "traktDvd",
      title: "DVD 发行",
      functionName: "loadTraktDvd",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
        {
          name: "query",
          title: "关键词",
          type: "input",
          placeholders: [{ title: "可选，搜索标题或简介", value: "" }],
        },
        {
          name: "genres",
          title: "类型",
          type: "input",
          placeholders: [{ title: "可选，如 drama,action", value: "" }],
        },
        {
          name: "countries",
          title: "国家",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 us,gb", value: "" }],
        },
        {
          name: "languages",
          title: "语言",
          type: "input",
          placeholders: [{ title: "可选，2 位代码，如 en,ja", value: "" }],
        },
      ],
    },
  ],
};

const TRAKT_API_BASE = "https://api.trakt.tv";
const TRAKT_MAX_DAYS = 33;

async function loadTraktShows(params = {}) {
  return loadShowCalendar("shows", params);
}

async function loadTraktNewShows(params = {}) {
  return loadShowCalendar("shows/new", params);
}

async function loadTraktSeasonPremieres(params = {}) {
  return loadShowCalendar("shows/premieres", params);
}

async function loadTraktFinales(params = {}) {
  return loadShowCalendar("shows/finales", params);
}

async function loadTraktMovies(params = {}) {
  return loadMovieCalendar("movies", params);
}

async function loadTraktDvd(params = {}) {
  return loadMovieCalendar("dvd", params);
}

async function loadShowCalendar(path, params) {
  const rows = await requestTraktCalendar(path, params);
  return rows.map((row) => toShowVideoItem(row)).filter(Boolean);
}

async function loadMovieCalendar(path, params) {
  const rows = await requestTraktCalendar(path, params);
  return rows.map((row) => toMovieVideoItem(row, path)).filter(Boolean);
}

async function requestTraktCalendar(path, params) {
  const target = normalizeTarget(params.calendarTarget);
  const startDate = normalizeStartDate(params.startDate);
  const days = normalizeDays(params.days);
  const url = `${TRAKT_API_BASE}/calendars/${target}/${path}/${startDate}/${days}`;
  const res = await Widget.http.get(url, {
    headers: traktHeaders(params, target),
    params: traktQuery(params),
  });

  if (!res || !Array.isArray(res.data)) {
    throw new Error("Trakt 日历返回了非数组响应");
  }

  return res.data;
}

function traktHeaders(params, target) {
  const clientId = clean(params.traktClientId);
  if (!clientId) {
    throw new Error("请先在全局参数填写 Trakt Client ID");
  }

  const headers = {
    "Content-Type": "application/json",
    "trakt-api-key": clientId,
    "trakt-api-version": "2",
  };

  const token = clean(params.traktAccessToken);
  if (target === "my") {
    if (!token) {
      throw new Error("我的日历需要填写 OAuth access token");
    }
    headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function traktQuery(params) {
  const query = {};
  if (params.extended && params.extended !== "minimal") query.extended = params.extended;
  copyFilter(query, params, "query");
  copyFilter(query, params, "genres");
  copyFilter(query, params, "countries");
  copyFilter(query, params, "languages");
  copyFilter(query, params, "networks");
  return query;
}

function copyFilter(query, params, name) {
  const value = clean(params[name]);
  if (value) query[name] = value;
}

function normalizeTarget(value) {
  return value === "my" ? "my" : "all";
}

function normalizeStartDate(value) {
  const date = clean(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Date().toISOString().slice(0, 10);
}

function normalizeDays(value) {
  const parsed = Number(value || 7);
  if (!Number.isFinite(parsed)) return 7;
  return Math.max(1, Math.min(TRAKT_MAX_DAYS, Math.floor(parsed)));
}

function toShowVideoItem(row) {
  const show = row && row.show;
  const episode = row && row.episode;
  if (!show && !episode) return null;

  const showIds = (show && show.ids) || {};
  const episodeIds = (episode && episode.ids) || {};
  const showTitle = clean(show && show.title) || "未知剧集";
  const episodeLabel = formatEpisodeLabel(episode);
  const releaseDate = dateOnly(row.first_aired || (episode && episode.first_aired));
  const description = compact([
    episodeLabel,
    row.first_aired ? `首播: ${formatDateTime(row.first_aired)}` : "",
    show && show.network ? `电视网: ${show.network}` : "",
    show && show.status ? `状态: ${show.status}` : "",
    clean(episode && episode.overview),
    clean(show && show.overview),
  ]).join("\n");

  const item = {
    id: toNumber(showIds.tmdb) || `trakt.show.${showIds.trakt || showIds.slug || episodeIds.trakt || showTitle}`,
    type: toNumber(showIds.tmdb) ? "tmdb" : "url",
    mediaType: "tv",
    title: episodeLabel ? `${showTitle} ${episodeLabel}` : showTitle,
    releaseDate,
    rating: normalizeRating(show && show.rating),
    description,
    genreItems: genreItems(show && show.genres),
    episodeItems: episode ? [episodeVideoItem(show, episode, row.first_aired)] : [],
  };

  if (item.type === "url") {
    item.link = detailLink("show", showIds.trakt || showIds.slug || item.id);
    storeDetail(item);
  }

  return item;
}

function toMovieVideoItem(row, calendarKind) {
  const movie = row && row.movie;
  if (!movie) return null;

  const ids = movie.ids || {};
  const tmdbId = toNumber(ids.tmdb);
  const releaseDate = dateOnly(row.released || movie.released);
  const title = clean(movie.title) || "未知电影";
  const item = {
    id: tmdbId || `trakt.movie.${ids.trakt || ids.slug || title}`,
    type: tmdbId ? "tmdb" : "url",
    mediaType: "movie",
    title,
    releaseDate,
    rating: normalizeRating(movie.rating),
    description: compact([
      calendarKind === "dvd" ? "DVD / 物理介质发行" : "影院/平台上映",
      row.released ? `日期: ${row.released}` : "",
      movie.year ? `年份: ${movie.year}` : "",
      clean(movie.overview),
    ]).join("\n"),
    genreItems: genreItems(movie.genres),
  };

  if (item.type === "url") {
    item.link = detailLink("movie", ids.trakt || ids.slug || item.id);
    storeDetail(item);
  }

  return item;
}

function episodeVideoItem(show, episode, firstAired) {
  const ids = episode.ids || {};
  const showTitle = clean(show && show.title) || "未知剧集";
  const label = formatEpisodeLabel(episode);
  const link = detailLink("episode", ids.trakt || `${showTitle}.${episode.season}.${episode.number}`);
  const item = {
    id: `trakt.episode.${ids.trakt || ids.tmdb || `${episode.season}.${episode.number}`}`,
    type: "url",
    title: label || clean(episode.title) || showTitle,
    releaseDate: dateOnly(firstAired || episode.first_aired),
    duration: toNumber(episode.runtime),
    description: compact([
      showTitle,
      firstAired ? `首播: ${formatDateTime(firstAired)}` : "",
      clean(episode.overview),
    ]).join("\n"),
    link,
  };
  storeDetail(item);
  return item;
}

async function loadDetail(link) {
  const key = `trakt.calendar.detail.${link}`;
  return Widget.storage.get(key) || null;
}

function storeDetail(item) {
  if (!item || !item.link) return;
  Widget.storage.set(`trakt.calendar.detail.${item.link}`, item);
}

function detailLink(type, id) {
  return `trakt:${type}:${id}`;
}

function formatEpisodeLabel(episode) {
  if (!episode) return "";
  const season = episode.season != null ? `S${pad2(episode.season)}` : "";
  const number = episode.number != null ? `E${pad2(episode.number)}` : "";
  const code = season || number ? `${season}${number}` : "";
  return compact([code, clean(episode.title)]).join(" ");
}

function pad2(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return n < 10 ? `0${n}` : String(n);
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return undefined;
  return rating > 10 ? Math.round(rating) / 10 : Math.round(rating * 10) / 10;
}

function genreItems(genres) {
  if (!Array.isArray(genres)) return [];
  return genres.map((genre) => ({ id: String(genre), title: String(genre) }));
}

function dateOnly(value) {
  const text = clean(value);
  return text ? text.slice(0, 10) : "";
}

function formatDateTime(value) {
  const text = clean(value);
  return text ? text.replace("T", " ").replace(".000Z", " UTC") : "";
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function compact(values) {
  return values.filter((value) => value !== undefined && value !== null && String(value).trim() !== "");
}
