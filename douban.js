WidgetMetadata = {
  id: "douban_hot",
  title: "豆瓣热播",
  description: "豆瓣热门影视榜单",
  author: "seven",
  version: "1.1.0",
  requiredVersion: "0.0.1",
  modules: [
    { title: "🔥 热播电影", functionName: "movie", cacheDuration: 3600 },
    { title: "📺 热播剧集", functionName: "tv", cacheDuration: 3600 },
    { title: "🎨 热播动画", functionName: "anime", cacheDuration: 3600 },
    { title: "🎤 热播综艺", functionName: "show", cacheDuration: 3600 }
  ]
};

// --- 入口函数 ---

async function movie() {
  return load("movie_hot");
}

async function tv() {
  return load("tv_hot");
}

async function anime() {
  return load("tv_animation");
}

async function show() {
  return load("show_hot");
}

// --- 核心加载逻辑 ---

async function load(type) {
  const url = `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?start=0&count=20`;

  try {
    // 发起网络请求
    const res = await Widget.http.get(url, {
      headers: {
        "Referer": "https://m.douban.com/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*"
      }
    });

    // 1. 检查响应是否为空
    if (!res || !res.body) {
      console.log(`[${type}] 错误: 响应为空`);
      return [];
    }

    // 2. 预处理响应内容：如果是字符串 "undefined"，说明被豆瓣拦截
    let rawBody = res.body;
    if (typeof rawBody === "string") {
      rawBody = rawBody.trim();
    }

    if (!rawBody || rawBody === "undefined") {
      console.log(`[${type}] 错误: 豆瓣返回了 undefined，可能触发了流量控制`);
      return [];
    }

    // 3. 安全解析 JSON
    let data;
    try {
      // 如果环境已经自动转成了对象，直接用；否则解析
      data = (typeof rawBody === "object") ? rawBody : JSON.parse(rawBody);
    } catch (parseError) {
      console.log(`[${type}] 解析失败: 返回的不是有效的 JSON。内容开头为: ${rawBody.substring(0, 40)}`);
      return [];
    }

    // 4. 提取列表数据
    const list = data.subject_collection_items || [];

    // 5. 格式化输出
    return list.map(item => ({
      id: String(item.id),
      type: "video",
      title: item.title,
      cover: item.cover?.url || "",
      description: item.rating?.value ? `⭐ ${item.rating.value}` : "暂无评分",
      link: `https://movie.douban.com/subject/${item.id}/`
    }));

  } catch (globalError) {
    console.log(`[${type}] 网络请求崩溃: ${globalError.message}`);
    return [];
  }
}
