/**
 * 豆瓣综合推荐 Widget
 * 修复：个性化推荐接口导致的格式不正确报错
 * 保持：1.3.5 版本原汁原味的热播功能
 */

WidgetMetadata = {
  id: "douban_all_in_one_fixed",
  title: "豆瓣推荐",
  description: "热播分类与猜你喜欢，修复数据格式报错",
  author: "编码助手",
  version: "2.1.0",
  
  modules: [
    {
      title: "热播内容",
      functionName: "loadDoubanList",
      type: "video",
      params: [
        {
          name: "category",
          title: "分类",
          type: "enumeration",
          value: "电视剧",
          enumOptions: [
            { title: "电视剧", value: "电视剧" },
            { title: "综艺", value: "综艺" },
            { title: "动漫", value: "动漫" }
          ]
        },
        { name: "page_limit", title: "数量", type: "constant", value: "20" }
      ]
    },
    {
      title: "猜你喜欢",
      functionName: "loadPersonalized",
      type: "video",
      params: [
        { name: "db_cookie", title: "豆瓣Cookie(必填)", type: "string", value: "" },
        { name: "page_limit", title: "数量", type: "constant", value: "20" }
      ]
    }
  ]
};

// --- 模块 1：你最稳定的 1.3.5 热播逻辑 ---
async function loadDoubanList(params = {}) {
  try {
    const { category = "电视剧", page_limit = 20 } = params;
    let targetTag = "热门";
    if (category === "综艺") targetTag = "综艺";
    else if (category === "动漫") targetTag = "日本动画";
    
    const url = "https://movie.douban.com/j/search_subjects";
    const response = await Widget.http.get(url, {
      params: {
        type: 'tv',
        tag: targetTag,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    if (!response || !response.data || !response.data.subjects) return [];

    return response.data.subjects.map(item => ({
      id: String(item.id),
      type: "douban",
      title: cleanTitleText(item.title),
      rating: parseFloat(item.rate) || 0,
      coverUrl: item.cover,
      link: item.url,
      description: `评分: ${item.rate}`
    }));
  } catch (e) {
    return [];
  }
}

// --- 模块 2：个性化推荐 (格式重构) ---
async function loadPersonalized(params = {}) {
  try {
    const { db_cookie = "", page_limit = 20 } = params;
    // 使用个性化接口
    const url = "https://m.douban.com/rexxar/api/v2/recommend_feed";
    
    const response = await Widget.http.get(url, {
      params: { for_mobile: 1, limit: page_limit },
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://m.douban.com/",
        "Cookie": db_cookie,
        "Host": "m.douban.com"
      }
    });

    // 格式校验防护
    if (!response || !response.data || !Array.isArray(response.data.recommend_feeds)) {
      return [];
    }
    
    const results = [];
    for (const feed of response.data.recommend_feeds) {
      const target = feed.target;
      // 只提取影视类型数据，过滤掉话题、日记等
      if (target && (target.type === 'movie' || target.type === 'tv')) {
        results.push({
          id: String(target.id),
          type: "douban",
          title: cleanTitleText(target.title),
          rating: target.rating ? (target.rating.value || 0) : 0,
          coverUrl: target.cover_url || (target.card_background && target.card_background.url) || "",
          link: target.uri || "",
          description: target.card_subtitle || `评分: ${target.rating ? target.rating.value : '暂无'}`
        });
      }
    }
    return results;
  } catch (error) {
    console.error("个性化接口异常:", error);
    return [];
  }
}

// 统一标题清洗函数
function cleanTitleText(title) {
  if (!title) return "未知名称";
  return title
    .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
    .replace(/Season\s?\d+/gi, '')
    .replace(/S\d+/gi, '')
    .replace(/(最终季|完结篇|特别篇)/g, '')
    .replace(/\s\d+$/g, '') 
    .trim();
}
