WidgetMetadata = {
  id: "douban_hot",
  title: "豆瓣热播",
  description: "豆瓣热门影视榜单",
  author: "seven",
  version: "1.0.1", // 更新版本号
  requiredVersion: "0.0.1",
  modules: [
    { title: "🔥 热播电影", functionName: "movie", cacheDuration: 3600 },
    { title: "📺 热播剧集", functionName: "tv", cacheDuration: 3600 },
    { title: "🎨 热播动画", functionName: "anime", cacheDuration: 3600 },
    { title: "🎤 热播综艺", functionName: "show", cacheDuration: 3600 }
  ]
};

async function movie() { return load("movie_hot"); }
async function tv() { return load("tv_hot"); }
async function anime() { return load("tv_animation"); }
async function show() { return load("show_hot"); }

async function load(type) {
  const url = `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?start=0&count=20`;

  try {
    const res = await Widget.http.get(url, {
      headers: {
        // 1. 优化 Headers：伪装成真实的手机 Safari 浏览器
        "Referer": "https://m.douban.com/movie/",
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        "Accept": "application/json, text/plain, */*",
        "Connection": "keep-alive"
      }
    });

    // 2. 拦截空数据或 "undefined" 字符串
    if (!res || !res.body || res.body === "undefined") {
      console.error(`[${type}] 请求失败: 响应为空或未定义`);
      return []; // 返回空数组避免后续渲染崩溃
    }

    // 3. 安全解析 JSON
    let data;
    try {
      data = JSON.parse(res.body);
    } catch (parseError) {
      // 截取前 100 个字符方便调试，避免被长 HTML 刷屏
      const snippet = String(res.body).substring(0, 100);
      console.error(`[${type}] JSON 解析失败，可能触发了豆瓣反爬验证。返回内容: ${snippet}...`);
      return [];
    }

    // 4. 安全提取列表
    const list = data.subject_collection_items || [];

    return list.map(item => ({
      id: String(item.id),
      type: "video",
      title: item.title,
      // 使用可选链 (?.) 并在缺失图片时提供空字符串，防止报错
      cover: item.cover?.url || "",
      description: item.rating?.value ? `⭐ ${item.rating.value}` : "暂无评分",
      link: `https://movie.douban.com/subject/${item.id}/`
    }));

  } catch (networkError) {
    // 5. 捕获网络层面的错误（如断网、超时）
    console.error(`[${type}] 网络请求异常:`, networkError);
    return [];
  }
}
