WidgetMetadata = {
  id: "forward.trakt.calendar.simple",
  title: "Trakt 日历",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  description: "获取 Trakt 公开剧集和电影日历。",
  author: "Forward",
  site: "https://trakt.tv",
  modules: [
    {
      id: "traktShows",
      title: "剧集日历",
      functionName: "loadTraktShows",
      cacheDuration: 1800,
      requiresWebView: false,
      params: [
        {
          name: "traktClientId",
          title: "Trakt Client ID",
          type: "input",
          placeholders: [{ title: "Trakt API app 的 Client ID", value: "" }],
        },
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
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
          name: "traktClientId",
          title: "Trakt Client ID",
          type: "input",
          placeholders: [{ title: "Trakt API app 的 Client ID", value: "" }],
        },
        {
          name: "startDate",
          title: "开始日期",
          type: "input",
          placeholders: [{ title: "YYYY-MM-DD，留空为今天 UTC", value: "" }],
        },
        { name: "days", title: "天数", type: "count", value: 7 },
      ],
    },
  ],
};

const TRAKT_API_BASE = "https://api.trakt.tv";

async function loadTraktShows(params = {}) {
  const rows = await requestTraktCalendar("shows", params);
  return rows.map(toShowVideoItem).filter(Boolean);
}

async function loadTraktMovies(params = {}) {
  const rows = await requestTraktCalendar("movies", params);
  return rows.map(toMovieVideoItem).filter(Boolean);
}

async function requestTraktCalendar(path, params) {
  const clientId = clean(params.traktClientId);
  if (!clientId) throw new Error("请填写 Trakt Client ID");

  const startDate = normalizeStartDate(params.startDate);
  const days = normalizeDays(params.days);
  const url = `${TRAKT_API_BASE}/calendars/all/${path}/${startDate}/${days}`;
  const res = await Widget.http.get(url, {
    headers: {
      "Content-Type": "application/json",
      "trakt-api-key": clientId,
      "trakt-api-version": "2",
    },
    params: { extended: "full" },
  });

  if (!res || !Array.isArray(res.data)) {
    throw new Error("Trakt 日历返回格式不正确");
  }

  return res.data;
}

function toShowVideoItem(row) {
  const show = row && row.show;
  const episode = row && row.episode;
  if (!show) return null;

  const ids = show.ids || {};
  const tmdbId = toNumber(ids.tmdb);
  const title = compact([clean(show.title), formatEpisodeLabel(episode)]).join(" ");

  return {
    id: tmdbId || `trakt.show.${ids.trakt || ids.slug || clean(show.title)}`,
    type: tmdbId ? "tmdb" : "url",
    mediaType: "tv",
    title: title || "未知剧集",
    releaseDate: dateOnly(row.first_aired || (episode && episode.first_aired)),
    rating: normalizeRating(show.rating),
    description: compact([
      row.first_aired ? `首播: ${formatDateTime(row.first_aired)}` : "",
      show.network ? `电视网: ${show.network}` : "",
      show.status ? `状态: ${show.status}` : "",
      episode && episode.overview ? episode.overview : "",
      show.overview,
    ]).join("\n"),
  };
}

function toMovieVideoItem(row) {
  const movie = row && row.movie;
  if (!movie) return null;

  const ids = movie.ids || {};
  const tmdbId = toNumber(ids.tmdb);

  return {
    id: tmdbId || `trakt.movie.${ids.trakt || ids.slug || clean(movie.title)}`,
    type: tmdbId ? "tmdb" : "url",
    mediaType: "movie",
    title: clean(movie.title) || "未知电影",
    releaseDate: dateOnly(row.released || movie.released),
    rating: normalizeRating(movie.rating),
    description: compact([
      row.released ? `日期: ${row.released}` : "",
      movie.year ? `年份: ${movie.year}` : "",
      movie.overview,
    ]).join("\n"),
  };
}

function normalizeStartDate(value) {
  const text = clean(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return new Date().toISOString().slice(0, 10);
}

function normalizeDays(value) {
  const number = Number(value || 7);
  if (!Number.isFinite(number)) return 7;
  return Math.max(1, Math.min(33, Math.floor(number)));
}

function formatEpisodeLabel(episode) {
  if (!episode) return "";
  const season = episode.season != null ? `S${pad2(episode.season)}` : "";
  const number = episode.number != null ? `E${pad2(episode.number)}` : "";
  return compact([`${season}${number}`, clean(episode.title)]).join(" ");
}

function pad2(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return number < 10 ? `0${number}` : String(number);
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return undefined;
  return rating > 10 ? Math.round(rating) / 10 : Math.round(rating * 10) / 10;
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
