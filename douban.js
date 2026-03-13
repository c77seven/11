/**
 * 豆瓣热播 Widget
 * 支持：电视剧、综艺、动漫
 */

// 1. 定义元数据 (必须在最外层)
WidgetMetadata = {
  id: "douban_hot_aggregator",
  title: "豆瓣热播",
  description: "实时获取豆瓣热门电视剧、综艺和动漫列表",
  author: "Coder",
  version: "1.0.0",
  requiredVersion: "0.0.3",
  
  modules: [
    {
      title: "热播内容",
      functionName: "loadDoubanList",
      type: "video",
      cacheDuration: 3600, // 缓存1小时
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

// 2. 处理器函数
async function loadDoubanList(params = {}) {
  try {
    const { category = "电视剧", page_limit = 20 } = params;
    
    // 豆瓣 API 路径
    const url = "https://movie.douban.com/j/search_subjects";
    
    // 使用 Widget.http.get 发送请求
    const response = await Widget.http.get(url, {
      params: {
        type: 'tv',
        tag: category,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    if (!response || !response.data || !response.data.subjects) {
      console.error("豆瓣响应异常:", JSON.stringify(response));
      return [];
    }

    // 将原始数据映射为规范的 VideoItem 数组
    return response.data.subjects.map(item => ({
      id: item.id,               // 必填
      type: "douban",            // 类型设为 douban，App会自动补全详情
      title: item.title,
      rating: parseFloat(item.rate) || 0,
      coverUrl: item.cover,
      link: item.url,            // 原始链接
      description: `评分: ${item.rate}`,
      extra: {
        isNew: item.is_new
      }
    }));

  } catch (error) {
    console.error("加载豆瓣列表失败:", error);
    return [];
  }
}
