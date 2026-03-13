/**
 * 豆瓣热播 Widget (数据防抖修复版)
 * 1. 修复：动漫/电视剧分类数据陈旧或缺失
 * 2. 修复：标题季数/部数清洗
 * 3. 增强：数据为空时的容错处理
 */

WidgetMetadata = {
  id: "douban_hot_pro_v5",
  title: "豆瓣热播",
  description: "同步豆瓣剧集频道热播榜单",
  author: "编码助手",
  version: "1.5.0",
  
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
    
    // --- 核心修复：重新对齐豆瓣“热播剧集”频道的实时标签 ---
    let targetTag = "热门";
    let sortType = "recommend"; 

    if (category === "综艺") {
      targetTag = "综艺";
      sortType = "time"; // 综艺按更新时间排最准
    } else if (category === "动漫") {
      // “日本动画”是剧集频道下动画类最实时、数据最全的标签
      targetTag = "日本动画"; 
      sortType = "time"; 
    } else {
      // 电视剧使用“近期热播”或“热门”
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    // --- 关键：解决“数据缺失”添加失败的问题 ---
    // 如果 response 为空或 subjects 不存在，返回空数组而不是报错
    if (!response || !response.data || !response.data.subjects || response.data.subjects.length === 0) {
      console.warn(`[警告] 分类 ${category} 未能抓取到数据`);
      return []; 
    }

    return response.data.subjects.map(item => {
      // 标题清洗：移除 第X季、第X部、Season、S01等
      let cleanTitle = (item.title || "未知标题")
        .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
        .replace(/Season\s?\d+/gi, '')
        .replace(/S\d+/gi, '')
        .replace(/(最终季|完结篇|特别篇|第[一二三四五六七八九十\d]+次)/g, '')
        .trim();

      // 进一步移除末尾的空格数字（例如：大江大河 2 -> 大江大河）
      cleanTitle = cleanTitle.replace(/\s\d+$/g, '').trim();

      return {
        id: item.id || String(Math.random()),
        type: "douban",
        title: cleanTitle,
        rating: parseFloat(item.rate) || 0,
        coverUrl: item.cover,
        link: item.url,
        description: `评分: ${item.rate}`
      };
    });

  } catch (error) {
    console.error("Widget 执行出错:", error);
    return []; // 确保出错时返回空数组，避免 Widget 框架崩溃
  }
}
