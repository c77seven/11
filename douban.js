/**
 * 豆瓣热播 Widget (实时同步优化版)
 * 1. 修复：动漫分类无法加载（改用更通用的“动画”标签）
 * 2. 修复：数据陈旧（改用 time 排序获取热播新作）
 * 3. 修复：数据缺失报错（增加严格的字段校验）
 */

WidgetMetadata = {
  id: "douban_hot_sync_v7",
  title: "豆瓣热播",
  description: "同步豆瓣剧集频道热播内容，自动清洗标题",
  author: "编码助手",
  version: "1.7.0",
  
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
    
    // 标签映射：动漫必须对应“动画”才能在剧集接口拿到热播数据
    const tagMap = {
      "电视剧": "热门",
      "综艺": "综艺",
      "动漫": "动画" 
    };
    
    const targetTag = tagMap[category] || "热门";
    
    // 排序逻辑：动漫和综艺用 time (最新)，电视剧用 recommend (热播)
    const sortType = (category === "电视剧") ? "recommend" : "time";

    const url = "https://movie.douban.com/j/search_subjects";
    const response = await Widget.http.get(url, {
      params: {
        type: 'tv',
        tag: targetTag,
        sort: sortType,
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://movie.douban.com/explore"
      }
    });

    // 严谨校验：确保 subjects 存在且为数组
    if (!response || !response.data || !Array.isArray(response.data.subjects)) {
      return [];
    }

    return response.data.subjects
      .filter(item => item && item.id && item.title) // 过滤掉缺失关键字段的脏数据
      .map(item => {
        // 标题清洗：去除季数、部数、Season、S01 等
        const cleanTitle = String(item.title)
          .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
          .replace(/Season\s?\d+/gi, '')
          .replace(/S\d+/gi, '')
          .replace(/(最终季|完结篇|特别篇)/g, '')
          .replace(/\s\d+$/g, '') 
          .trim();

        return {
          id: String(item.id),
          type: "douban",
          title: cleanTitle || item.title,
          rating: parseFloat(item.rate) || 0,
          coverUrl: item.cover || "",
          link: item.url || "",
          description: `评分: ${item.rate || '0'}`
        };
      });

  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}
