/**
 * 豆瓣热播组件模块
 * 功能：获取豆瓣热门电视剧、综艺、动漫
 */

const DoubanService = {
  // 配置基础参数
  CONFIG: {
    baseUrl: 'https://movie.douban.com/j/search_subjects',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1',
      'Referer': 'https://movie.douban.com/'
    }
  },

  /**
   * 核心抓取函数
   * @param {string} type 分类名称：'电视剧' | '综艺' | '动漫'
   * @param {number} limit 获取数量
   */
  async fetchHotList(type = '电视剧', limit = 10) {
    try {
      const response = await Widget.http.get(this.CONFIG.baseUrl, {
        params: {
          type: 'tv',
          tag: type,
          sort: 'recommend', // 热门推荐
          page_limit: limit,
          page_start: 0
        },
        headers: this.CONFIG.headers
      });

      if (response.status === 200 && response.data.subjects) {
        return this.formatData(response.data.subjects);
      }
      return [];
    } catch (error) {
      console.error(`[Douban] 抓取${type}异常:`, error);
      return [];
    }
  },

  /**
   * 格式化数据，适配 Widget UI
   */
  formatData(items) {
    return items.map(item => ({
      id: item.id,
      title: item.title,
      score: item.rate || '暂无评分',
      cover: item.cover,
      url: item.url,
      isNew: item.is_new
    }));
  }
};

// 导出模块或直接在脚本中使用
// 示例调用：
// const series = await DoubanService.fetchHotList('电视剧');
// const variety = await DoubanService.fetchHotList('综艺');
// const anime = await DoubanService.fetchHotList('动漫');
