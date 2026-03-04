# /**
 * Trakt Upcoming Schedule Widget for Forward
 * 功能：显示未来 7 天即将播出的剧集，并在剧名后方标注更新时间
 */

const axios = require('axios');
const dayjs = require('dayjs');

// === 配置区域 ===
const TRAKT_CLIENT_ID = '你的_TRAKT_CLIENT_ID'; // 请务必在此替换你的 Trakt Client ID
const FETCH_DAYS = 7; // 获取未来几天的日程
// ================

module.exports = async (context) => {
    const { env } = context;

    // 1. 检查 API Key
    if (!TRAKT_CLIENT_ID || TRAKT_CLIENT_ID.includes('你的')) {
        return {
            name: "错误：未配置 Trakt ID",
            type: "text",
            data: [{ title: "请在脚本中填写你的 Trakt Client ID" }]
        };
    }

    try {
        const startDate = dayjs().format('YYYY-MM-DD');
        const url = `https://api.trakt.tv/calendars/all/shows/${startDate}/${FETCH_DAYS}`;
        
        // 2. 请求 Trakt API
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'trakt-api-version': '2',
                'trakt-api-key': TRAKT_CLIENT_ID,
            },
            timeout: 5000
        });

        // 3. 转换数据格式为 Stremio / Forward Widget 格式
        const items = response.data.map(item => {
            const airDate = dayjs(item.first_aired);
            const now = dayjs();
            
            // 智能时间显示
            let timeTag = '';
            const diffDays = airDate.startOf('day').diff(now.startOf('day'), 'day');
            
            if (diffDays === 0) timeTag = `今日 ${airDate.format('HH:mm')}`;
            else if (diffDays === 1) timeTag = `明日 ${airDate.format('HH:mm')}`;
            else timeTag = airDate.format('MM-DD HH:mm');

            return {
                id: item.show.ids.imdb || `trakt-${item.show.ids.trakt}`,
                // 核心：把时间写在名字里
                name: `${item.show.title} [${timeTag}]`,
                type: 'series',
                poster: `https://images.metahub.space/poster/medium/${item.show.ids.imdb}/img`,
                description: `第 ${item.episode.season} 季第 ${item.episode.number} 集: ${item.episode.title}\n播出时间: ${airDate.format('YYYY-MM-DD HH:mm')}`,
                // 跳转到 Stremio 详情页
                url: `stremio://detail/series/${item.show.ids.imdb}`
            };
        });

        // 4. 返回 Widget 结果
        return {
            name: "Trakt 追剧日程",
            type: "movie", // 或者是 "series"
            data: items
        };

    } catch (error) {
        return {
            name: "Trakt 加载失败",
            type: "text",
            data: [{ title: `错误: ${error.message}` }]
        };
    }
};
