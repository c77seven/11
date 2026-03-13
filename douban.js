/**
 * 豆瓣热播 Widget (优化版)
 * 已修复：电视剧、动漫获取不到数据的问题
 */

WidgetMetadata = {
  id: "douban_hot_aggregator",
  title: "豆瓣热播",
  description: "实时获取豆瓣热门电视剧、综艺和动画列表",
  author: "编码助手",
  version: "1.1.0",
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
            { title: "动漫", value: "动漫" } // 用户看到的是动漫
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
    
    // 1. 核心修复：标签映射表
    // 豆瓣 API 识别的是 "动画" 而不是 "动漫"
    const tagMap = {
      "电视剧": "电视剧",
      "综艺": "综艺",
      "动漫": "动画" 
    };
    
    const targetTag = tagMap[category] || category;
    const url = "https://movie.douban.com/j/search_subjects";
    
    // 2. 发送请求
    const response = await Widget.http.get(url, {
      params: {
        type: 'tv', // 电视剧、综艺、动画在豆瓣接口中通常统一归类为 tv
        tag: targetTag,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Referer": `https://movie.douban.com/tv/` 
      }
    });

    // 3. 校验数据
    if (!response || !response.data || !Array.isArray(response.data.subjects)) {
      console.error(`豆瓣[${category}]响应异常:`, JSON.stringify(response));
      return [];
    }

    // 4. 数据转换
    return response.data.subjects.map(item => ({
      id: item.id,
      type: "douban",
      title: item.title,
      rating: parseFloat(item.rate) || 0,
      coverUrl: item.cover,
      link: item.url,
      description: `评分: ${item.rate}`,
      extra: {
        isNew: item.is_new,
        originalTag: targetTag
      }
    }));

  } catch (error) {
    console.error("加载豆瓣列表失败:", error);
    return [];
  }
}
