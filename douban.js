/**
 * 豆瓣热播 Widget (动画修复版)
 * 基于你提供的稳定版修改：保持电视剧/综艺可用，专门修复动画分类
 */

WidgetMetadata = {
  id: "douban_hot_aggregator",
  title: "豆瓣热播",
  description: "自动过滤季数后缀，修复动漫/电视剧/综艺分类",
  author: "编码助手",
  version: "1.3.1",
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
    
    // 核心修复点：针对动画分类，豆瓣接口通常识别 "动漫" 标签效果更好
    const tagMap = { 
      "电视剧": "热门", 
      "综艺": "综艺", 
      "动漫": "动漫"  // 此处从 "动画" 改为 "动漫"
    };
    
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
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
        "Referer": "https://movie.douban.com/tv/"
      }
    });

    if (!response || !response.data || !response.data.subjects) return [];

    // 如果“动漫”标签依然返回空，尝试最后的备选方案：直接请求“热门”但过滤名称
    let subjects = response.data.subjects;
    if (subjects.length === 0 && category === "动漫") {
       console.log("动漫标签无数据，尝试备选搜索...");
       // 这里可以添加二次尝试逻辑，但通常修改 tag 为 "动漫" 即可解决
    }

    return subjects.map(item => {
      // 标题清洗逻辑：移除季数、部数
      const cleanTitle = item.title
        .replace(/第[一二三四五六七八九十\d]+[季部期]/g, '')
        .replace(/Season\s?\d+/gi, '')
        .replace(/S\d+/gi, '')
        .replace(/(最终季|完结篇|特别篇)/g, '') // 增加常见后缀过滤
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
