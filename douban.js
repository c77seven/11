/**
 * 豆瓣热播 Widget (实时热播同步版)
 * 修复：动漫分类数据不实时、数据陈旧问题
 * 优化：标题清洗、排序逻辑
 */

WidgetMetadata = {
  id: "douban_hot_realtime",
  title: "豆瓣热播",
  description: "实时获取豆瓣热播电视剧、综艺和新番动漫",
  author: "编码助手",
  version: "1.4.0",
  
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
    
    let targetTag = "热门";
    let sortType = "recommend"; // 默认推荐

    // 针对“热播”需求调整参数
    if (category === "综艺") {
      targetTag = "综艺";
      sortType = "time"; // 综艺通常按时间排最新
    } else if (category === "动漫") {
      // 抓取热播新番，"日本动画" 配合 "time" 排序是豆瓣最快更新的路径
      targetTag = "日本动画"; 
      sortType = "time"; 
    } else {
      // 电视剧使用 "热门" 配合 "recommend" 在豆瓣逻辑里即为“热播”
      targetTag = "热门";
      sortType = "recommend";
    }
    
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
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    if (!response || !response.data || !response.data.subjects) return [];

    return response.data.subjects.map(item => {
      // 标题清洗：精准过滤季数
      const cleanTitle = item.title
        .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
        .replace(/Season\s?\d+/gi, '')
        .replace(/S\d+/gi, '')
        .replace(/(最终季|完结篇|特别篇)/g, '')
        .replace(/\s\d+$/g, '') 
        .trim();

      return {
        id: item.id,
        type: "douban",
        title: cleanTitle,
        rating: parseFloat(item.rate) || 0,
        coverUrl: item.cover,
        link: item.url,
        description: `评分: ${item.rate}${item.is_new ? ' (新推)' : ''}`
      };
    });

  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}
