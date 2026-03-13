/**
 * 豆瓣热播 Widget (动画分类终极修复版)
 * 目标：解决“热播剧集”分类下的动画加载问题
 */

WidgetMetadata = {
  id: "douban_hot_aggregator_final",
  title: "豆瓣热播",
  description: "支持电视剧、综艺及热播动画，自动清洗季数",
  author: "编码助手",
  version: "1.3.2",
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
    
    // 映射表：电视剧用“热门”，综艺用“综艺”，动漫用“动画”
    // 注意：在 type=tv 情况下，tag 必须是“动画”才能匹配到热播番剧
    const tagMap = { 
      "电视剧": "热门", 
      "综艺": "综艺", 
      "动漫": "动画" 
    };
    
    const targetTag = tagMap[category] || category;
    
    const url = "https://movie.douban.com/j/search_subjects";
    const response = await Widget.http.get(url, {
      params: {
        type: 'tv', // 保持 TV 类型，因为动画也是剧集的一种
        tag: targetTag,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/tv/" // 模拟从剧集频道进入
      }
    });

    if (!response || !response.data || !response.data.subjects || response.data.subjects.length === 0) {
      // 如果“动画”还是空，尝试一个针对动漫的特殊标签组合
      if (category === "动漫") {
        console.log("尝试动漫备用标签...");
        return await retryAnime(page_limit);
      }
      return [];
    }

    return response.data.subjects.map(item => {
      // 标题清洗：移除 第X季/部/期、Season、S等
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

// 动漫分类专属备用函数（当标准标签失效时）
async function retryAnime(limit) {
  const url = "https://movie.douban.com/j/search_subjects";
  const resp = await Widget.http.get(url, {
    params: { type: 'tv', tag: '动漫', sort: 'recommend', page_limit: limit, page_start: 0 },
    headers: { "Referer": "https://movie.douban.com/tv/" }
  });
  
  if (!resp?.data?.subjects) return [];
  
  return resp.data.subjects.map(item => ({
    id: item.id,
    type: "douban",
    title: item.title.replace(/第[一二三四五六七八九十\d]+[季部期]/g, '').trim(),
    rating: parseFloat(item.rate) || 0,
    coverUrl: item.cover,
    link: item.url,
    description: `评分: ${item.rate}`
  }));
}
