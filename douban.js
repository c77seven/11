/**
 * 豆瓣热播 Widget (分流修复版)
 * 1. 修复：动画、电视剧空数据问题
 * 2. 修复：标题季数过滤
 */

WidgetMetadata = {
  id: "douban_hot_aggregator_v3",
  title: "豆瓣热播",
  description: "全分类适配 + 标题纯净化",
  author: "编码助手",
  version: "1.5.0",
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
    
    // --- 核心逻辑：针对不同分类调整参数 ---
    let apiTag = "";
    let apiType = "tv";

    if (category === "动漫") {
      apiTag = "动画"; 
      apiType = "tv";
    } else if (category === "电视剧") {
      apiTag = "剧集"; // 尝试使用“剧集”代替“电视剧”，这是豆瓣接口的常用高频标签
      apiType = "tv";
    } else {
      apiTag = "综艺";
      apiType = "tv";
    }

    const url = "https://movie.douban.com/j/search_subjects";
    
    const response = await Widget.http.get(url, {
      params: {
        type: apiType,
        tag: apiTag,
        sort: 'recommend',
        page_limit: page_limit,
        page_start: 0
      },
      headers: {
        // 模拟移动端浏览器，绕过部分复杂的桌面端校验
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
        "Referer": "https://m.douban.com/movie/"
      }
    });

    if (!response || !response.data || !response.data.subjects || response.data.subjects.length === 0) {
      // 备选方案：如果“剧集”标签也失败，尝试最通用的“热门”
      if (apiTag !== "热门") {
        console.log(`[重试] 尝试使用热门标签获取 ${category}`);
        params.category = "热门"; 
        return loadDoubanList({ category: "热门", page_limit });
      }
      return [];
    }

    // --- 标题清洗逻辑 ---
    return response.data.subjects.map(item => {
      let cleanTitle = item.title
        // 1. 移除 第X季/部/期
        .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
        // 2. 移除 最终季/完结篇
        .replace(/(最终季|完结篇|特别篇)/g, '')
        // 3. 移除 Season/S 后缀
        .replace(/Season\s?\d+/gi, '')
        .replace(/S\d+/gi, '')
        // 4. 移除末尾空格和孤立数字
        .trim()
        .replace(/\s\d+$/g, '');

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
    console.error("加载异常:", error);
    return [];
  }
}
