/**
 * 豆瓣热播 Widget (深度兼容版)
 * 修复了电视剧和动漫返回空数据的问题
 */

WidgetMetadata = {
  id: "douban_hot_aggregator",
  title: "豆瓣热播",
  description: "实时获取豆瓣热门电视剧、综艺和动画列表",
  author: "编码助手",
  version: "1.2.0",
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
    
    // 映射豆瓣标准的 Tag
    const tagMap = {
      "电视剧": "热门", // 重点：电视剧分类下使用 "热门" 标签最稳定
      "综艺": "综艺",
      "动漫": "动画"
    };
    
    // 映射豆瓣请求的 Type
    // 电视剧和动漫在 search_subjects 接口上有时需要 type=tv
    const typeMap = {
      "电视剧": "tv",
      "综艺": "tv",
      "动漫": "tv"
    };

    const targetTag = tagMap[category] || category;
    const targetType = typeMap[category] || "tv";
    
    const url = "https://movie.douban.com/j/search_subjects";
    
    const response = await Widget.http.get(url, {
      params: {
        type: targetType,
        tag: targetTag,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/",
        "Accept": "application/json, text/plain, */*"
      }
    });

    // 调试日志：如果还是不行，可以在控制台看到具体返回了什么
    if (!response || !response.data || !response.data.subjects) {
      console.log(`[Debug] ${category} 请求返回异常`, response);
      return [];
    }

    return response.data.subjects.map(item => ({
      id: item.id,
      type: "douban",
      title: item.title,
      rating: parseFloat(item.rate) || 0,
      coverUrl: item.cover,
      link: item.url,
      description: `评分: ${item.rate}`
    }));

  } catch (error) {
    console.error("加载豆瓣列表报错:", error);
    return [];
  }
}
