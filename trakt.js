// trakt_widget.js
const WidgetMetadata = {
  id: "trakt_recent_update",
  title: "Trakt 最近更新模块",
  description: "显示你最近更新的剧集，包括封面图和更新时间。",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  site: "https://trakt.tv",
  globalParams: [
    { name: "traktUser", title: "Trakt 用户名 (必填)", type: "input", value: "" },
    { name: "traktClientId", title: "Trakt Client ID (可选)", type: "input", value: "" }
  ],
  modules: [
    {
      title: "最近更新",
      functionName: "loadRecentUpdates",
      type: "list",
      cacheDuration: 300
    }
  ]
};

// 核心逻辑
async function loadRecentUpdates(params, page = 1) {
  const { traktUser, traktClientId } = params;
  if (!traktUser) return [];

  const CLIENT_ID = traktClientId || "YOUR_DEFAULT_CLIENT_ID"; // 可换成你的默认ClientID
  const API_BASE = "https://api.trakt.tv";

  try {
    const res = await Widget.http.get(`${API_BASE}/users/${traktUser}/watched/shows`, {
      headers: {
        'Content-Type': 'application/json',
        'trakt-api-version': '2',
        'trakt-api-key': CLIENT_ID
      }
    });
    let data = res.data || [];

    // 按更新时间排序
    data = data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    // 返回前10条，构建 Forward List 格式
    return data.slice(0, 10).map(show => ({
      title: show.title,
      desc: `更新时间: ${new Date(show.updated_at).toLocaleString()}`,
      image: show.images?.fanart?.full || "",
      url: `https://trakt.tv/shows/${show.ids.trakt}`
    }));
  } catch (e) {
    return [{
      title: "获取失败",
      desc: e.message || "无法访问 Trakt",
      image: "",
      url: ""
    }];
  }
}

// 导出模块
export default WidgetMetadata;
export { loadRecentUpdates };