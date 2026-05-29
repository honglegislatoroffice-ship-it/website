// netlify/edge-functions/get-news.js

export default async function (request, context) {
    // 改用 Deno 標準語法讀取環境變數
    const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
    const NOTION_DATABASE_ID = Deno.env.get("NOTION_DATABASE_ID");

    if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
        return new Response(`Netlify 後台的環境變數缺失。請檢查 NOTION_TOKEN 和 NOTION_DATABASE_ID 是否填寫正確。`, { status: 500 });
    }

    try {
        const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${NOTION_TOKEN}`,
                'Notion-Version': '2022-06-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sorts: [{ timestamp: "created_time", direction: "descending" }]
            })
        });

        // 如果 Notion 報錯，直接把 Notion 的錯誤原因丟給前端看
        if (!response.ok) {
            const errorText = await response.text();
            return new Response(`Notion 拒絕連線 (代碼 ${response.status}): ${errorText}`, { status: response.status });
        }

        const data = await response.json();
        const formattedData = data.results.map(page => ({
            id: page.id,
            date: page.properties.Date?.date?.start || '無日期',
            tag: page.properties.Tag?.select?.name || '公告',
            title: page.properties.Name?.title[0]?.plain_text || '無標題',
            link: page.properties.Link?.url || '#'
        }));

        return new Response(JSON.stringify(formattedData), {
            status: 200,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });

    } catch (error) {
        return new Response(`中介程式執行失敗: ${error.message}`, { status: 500 });
    }
}

export const config = { path: "/api/get-news" };