/**
 * 豆瓣热播 & 个性化推荐 Widget
 * 1. 保持：电视剧、综艺、动漫稳定获取
 * 2. 新增：基于 Cookie 的“猜你喜欢”个性化推荐
 */

WidgetMetadata = {
  id: "douban_aggregator_pro",
  title: "豆瓣推荐",
  description: "支持热播分类与个性化推荐，自动清洗标题",
  author: "编码助手",
  version: "2.0.0",
  
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
      functionName: "loadDoubanList",
      type: "video",
      params: [
        { name: "category", title: "模式", type: "constant", value: "个性化推荐" },
        { name: "db_cookie", title: "豆瓣Cookie(选填)", type: "string", value: "" },
        { name: "page_limit", title: "数量", type: "constant", value: "20" }
      ]
    }
  ]
};

async function loadDoubanList(params = {}) {
  try {
    const { category = "电视剧", page_limit = 20, db_cookie = "" } = params;
    
    // --- 分支 1：个性化推荐逻辑 ---
    if (category === "个性化推荐") {
      const url = "https://m.douban.com/rexxar/api/v2/recommend_feed";
      const response = await Widget.http.get(url, {
        params: { for_mobile: 1, next_date: "" },
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
          "Referer": "https://m.douban.com/",
          "Cookie": db_cookie, // 只有填了 Cookie 才会个性化
          "Host": "m.douban.com"
        }
      });

      if (!response || !response.data || !response.data.recommend_feeds) return [];
      
      return response.data.recommend_feeds
        .filter(f => f.target && (f.target.type === 'movie' || f.target.type === 'tv'))
        .map(feed => {
          const item = feed.target;
          return {
            id: String(item.id),
            type: "douban",
            title: cleanTitleText(item.title),
            rating: item.rating ? item.rating.value : 0,
            coverUrl: item.cover_url || (item.card_background && item.card_background.url),
            link: item.uri,
            description: item.card_subtitle || `评分: ${item.rating ? item.rating.value : '暂无'}`
          };
        });
    }

    // --- 分支 2：原 1.3.5 稳定版逻辑 ---
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

  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}

// 提取出的统一清洗函数（保持你最满意的正则逻辑）
function cleanTitleText(title) {
  if (!title) return "";
  return title
    .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
    .replace(/Season\s?\d+/gi, '')
    .replace(/S\d+/gi, '')
    .replace(/(最终季|完结篇|特别篇)/g, '')
    .replace(/\s\d+$/g, '') 
    .trim();
}
