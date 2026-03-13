/**
 * 豆瓣热播 Widget (分类适配增强版)
 * 修复：动漫分类无数据问题
 * 优化：标题季数过滤
 */

WidgetMetadata = {
  id: "douban_hot_aggregator_fixed",
  title: "豆瓣热播",
  description: "支持电视剧、综艺及动画，自动清洗季数",
  author: "编码助手",
  version: "1.3.5",
  requiredVersion: "0.0.3",
  
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
    
    // --- 关键逻辑：标签映射 ---
    let targetTag = "热门";
    if (category === "综艺") {
      targetTag = "综艺";
    } else if (category === "动漫") {
      // 核心修复：在热播剧集接口中，使用“日本动画”作为动漫分类的抓取标签最为稳定
      targetTag = "日本动画"; 
    } else {
      targetTag = "热门"; // 电视剧使用“热门”
    }
    
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

    return response.data.subjects.map(item => {
      // 标题清洗逻辑
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
        description: `评分: ${item.rate}`
      };
    });

  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}
