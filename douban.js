/**
 * 豆瓣热播 Widget (强制兼容版)
 * 解决“数据缺失”导致的添加失败问题
 */

WidgetMetadata = {
  id: "douban_hot_pro_v6",
  title: "豆瓣热播",
  description: "同步豆瓣热播，已修复动漫分类与标题清洗",
  author: "编码助手",
  version: "1.6.0",
  
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
    
    // 标签映射：确保动漫分类使用“动画”这个最广义的标签
    const tagMap = {
      "电视剧": "热门",
      "综艺": "综艺",
      "动漫": "动画"
    };
    
    const targetTag = tagMap[category] || "热门";
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
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    // --- 核心修复：防止数据缺失报错 ---
    if (!response || !response.data || !Array.isArray(response.data.subjects) || response.data.subjects.length === 0) {
      // 如果真的没数据，返回一个友好的占位符，防止 Widget 添加失败
      return [{
        id: "error_placeholder",
        type: "douban",
        title: `暂无${category}数据`,
        rating: 0,
        coverUrl: "",
        link: "https://movie.douban.com",
        description: "请稍后再试或更换分类"
      }];
    }

    // 过滤并清洗数据
    return response.data.subjects
      .filter(item => item && item.title && item.id) // 强制剔除不完整的对象
      .map(item => {
        // 标题清洗逻辑
        let cleanTitle = String(item.title)
          .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
          .replace(/Season\s?\d+/gi, '')
          .replace(/S\d+/gi, '')
          .replace(/(最终季|完结篇|特别篇)/g, '')
          .trim();

        // 移除末尾孤立数字
        cleanTitle = cleanTitle.replace(/\s\d+$/g, '').trim();

        return {
          id: String(item.id), // 强制转为字符串，防止框架 ID 校验失败
          type: "douban",
          title: cleanTitle || item.title, // 如果清洗后为空则保留原名
          rating: parseFloat(item.rate) || 0,
          coverUrl: item.cover || "",
          link: item.url || "",
          description: `评分: ${item.rate || '暂无'}`
        };
      });

  } catch (error) {
    console.error("加载豆瓣列表发生异常:", error);
    // 终极保底，返回空数组
    return [];
  }
}
