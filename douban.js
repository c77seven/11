/**
 * 豆瓣热播 Widget (全接口兼容版)
 * 修复：动画、电视剧无法加载的问题
 * 优化：自动过滤季数后缀
 */

WidgetMetadata = {
  id: "douban_hot_aggregator_v2",
  title: "豆瓣热播",
  description: "支持电视剧、综艺、动画，自动清洗标题",
  author: "编码助手",
  version: "1.4.0",
  requiredVersion: "0.0.3",
  
  modules: [
    {
      title: "热播内容",
      functionName: "loadDoubanList",
      type: "video",
      cacheDuration: 3600,
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
        {
          name: "page_limit",
          title: "数量",
          type: "constant",
          value: "20"
        }
      ]
    }
  ]
};

async function loadDoubanList(params = {}) {
  try {
    const { category = "电视剧", page_limit = 20 } = params;
    
    // 映射豆瓣 new_search_subjects 接口的标签
    const genreMap = {
      "电视剧": "电视剧",
      "综艺": "综艺",
      "动漫": "动画"
    };
    
    const targetGenre = genreMap[category] || "电视剧";
    
    // 使用更稳定的“新版搜索”接口
    const url = "https://movie.douban.com/j/new_search_subjects";
    
    const response = await Widget.http.get(url, {
      params: {
        sort: 'U',          // 近期热门排序
        range: '0,10',      // 评分范围 0-10
        tags: '',           // 留空，使用 genres 过滤
        genres: targetGenre,
        start: 0,
        limit: page_limit
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/explore"
      }
    });

    if (!response || !response.data || !response.data.data) {
      console.error(`[接口报错] ${category} 无法获取数据`);
      return [];
    }

    // 处理数据并清洗标题
    return response.data.data.map(item => {
      // 1. 获取原始标题
      let rawTitle = item.title;

      // 2. 正则清洗季数、部数 (如：第一季, Season 2, S3, 大江大河2)
      const cleanTitle = rawTitle
        .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
        .replace(/Season\s?\d+/gi, '')
        .replace(/S\d+/gi, '')
        .replace(/\s\d+$/g, '') 
        .trim();

      return {
        id: item.id,
        type: "douban",
        title: cleanTitle,
        rating: parseFloat(item.rate) || 0,
        coverUrl: item.cover,
        link: item.url,
        description: `评分: ${item.rate}`,
        extra: {
          originalTitle: rawTitle // 保留原始标题备用
        }
      };
    });

  } catch (error) {
    console.error("Widget 加载失败:", error);
    return [];
  }
}
