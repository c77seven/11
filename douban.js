/**
 * 豆瓣热播 Widget (标题纯净版)
 * 修复：电视剧/动漫获取、标题季数过滤
 */

WidgetMetadata = {
  id: "douban_hot_aggregator",
  title: "豆瓣热播",
  description: "自动过滤季数后缀的豆瓣热播列表",
  author: "编码助手",
  version: "1.3.0",
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
    
    const tagMap = { "电视剧": "热门", "综艺": "综艺", "动漫": "动画" };
    const targetTag = tagMap[category] || category;
    
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/"
      }
    });

    if (!response || !response.data || !response.data.subjects) return [];

    return response.data.subjects.map(item => {
      // 标题清洗逻辑
      const cleanTitle = item.title
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
        description: `评分: ${item.rate}`
      };
    });

  } catch (error) {
    console.error("加载失败:", error);
    return [];
  }
}
