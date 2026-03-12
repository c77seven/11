WidgetMetadata = {
  id: "douban_hot",
  title: "豆瓣热播",
  description: "豆瓣热播剧集 / 动画 / 综艺",
  author: "七七",
  site: "https://douban.com",
  version: "1.0.0",
  requiredVersion: "0.0.1",
  modules: [
    {
      title: "热播剧集",
      description: "豆瓣热门电视剧",
      functionName: "tvHot",
      cacheDuration: 3600,
      params: [
        {
          name: "page",
          title: "Page",
          type: "page",
          startPage: 1
        }
      ]
    },
    {
      title: "热播动画",
      description: "豆瓣热门动画",
      functionName: "animeHot",
      cacheDuration: 3600,
      params: [
        {
          name: "page",
          title: "Page",
          type: "page",
          startPage: 1
        }
      ]
    },
    {
      title: "热播综艺",
      description: "豆瓣热门综艺",
      functionName: "varietyHot",
      cacheDuration: 3600,
      params: [
        {
          name: "page",
          title: "Page",
          type: "page",
          startPage: 1
        }
      ]
    }
  ]
};

async function tvHot(params = {}) {
  return loadDouban("tv_hot", params.page);
}

async function animeHot(params = {}) {
  return loadDouban("tv_animation", params.page);
}

async function varietyHot(params = {}) {
  return loadDouban("show_hot", params.page);
}

async function loadDouban(type, page = 1) {

  const start = (page - 1) * 20;

  const url =
    `https://m.douban.com/rexxar/api/v2/subject_collection/${type}/items?start=${start}&count=20`;

  const res = await Widget.http.get(url, {
    headers: {
      Referer: "https://m.douban.com/",
      "User-Agent": "Mozilla/5.0"
    }
  });

  const data = JSON.parse(res.body);

  return data.subject_collection_items.map(item => ({
    id: item.id,
    type: "video",
    title: item.title,
    cover: item.cover.url,
    description: `评分 ${item.rating?.value || "暂无"}`
  }));
}