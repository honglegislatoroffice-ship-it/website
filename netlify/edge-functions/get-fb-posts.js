export default async (request, context) => {
  const NOTION_TOKEN = Deno.env.get("NOTION_TOKEN");
  const DATABASE_ID = Deno.env.get("NOTION_FB_DATABASE_ID");

  if (!NOTION_TOKEN || !DATABASE_ID) {
    return new Response("後台找不到 NOTION_TOKEN 或 NOTION_FB_DATABASE_ID 鑰匙！", { 
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        page_size: 6 // 網美牆先放最新 6 則貼文就好，才不會太擠 🐾
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(`Notion 狗狗不開門: ${errText}`, { status: response.status });
    }

    const data = await response.json();
    
    // 把 Notion 的複雜結構整理成前台看得懂的漂漂格式
    const posts = data.results.map(page => {
      const props = page.properties;
      return {
        content: props.貼文內容?.title[0]?.plain_text || "點擊下方按鈕觀看完整精彩動態...",
        link: props.貼文連結?.url || "#",
        image: props.照片網址?.url || "",
        date: props.發文日期?.date?.start || "剛剛"
      };
    });

    return new Response(JSON.stringify(posts), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (error) {
    return new Response(`後台發生魔法混亂: ${error.message}`, { status: 500 });
  }
};
