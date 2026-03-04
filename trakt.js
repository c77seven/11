import { Widget } from '@forward-widget/libs';
import axios from 'axios';

const TRAKT_CLIENT_ID = "你的trakt_client_id"; // ✅ 替换为你的 Trakt Client ID
const TRAKT_API_BASE = "https://api.trakt.tv";

interface TraktShow {
  title: string;
  updated_at: string;
  ids: { trakt: number };
  images?: { fanart?: { full: string } };
}

const traktWidget = new Widget({
  name: "Trakt 更新时间模块",
  width: 320,
  height: 200,
  updateInterval: 10 * 60 * 1000, // 10分钟刷新一次
  async render(container) {
    try {
      const { data } = await axios.get<TraktShow[]>(
        `${TRAKT_API_BASE}/users/me/watched/shows`,
        {
          headers: {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': TRAKT_CLIENT_ID,
          },
        }
      );

      if (!data || data.length === 0) {
        container.innerHTML = `<div style="padding:10px;">暂无观看记录</div>`;
        return;
      }

      // 最新更新的节目
      const latest = data.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )[0];

      const cover = latest.images?.fanart?.full ?? '';

      container.innerHTML = `
        <div style="font-family:sans-serif;padding:10px;display:flex;align-items:center;">
          ${cover ? `<img src="${cover}" alt="封面" style="width:80px;height:80px;margin-right:10px;object-fit:cover;border-radius:5px;">` : ''}
          <div>
            <div style="font-weight:bold;font-size:16px;">${latest.title}</div>
            <div style="font-size:14px;color:#666;">更新时间: ${new Date(latest.updated_at).toLocaleString()}</div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div style="color:red;padding:10px;">获取失败: ${(err as any).message}</div>`;
    }
  },
});

export default traktWidget;