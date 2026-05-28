interface TavilyResult {
  title: string;
  url: string;
  content: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
  answer?: string;
}

export interface SearchHit {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(query: string, maxResults = 5): Promise<SearchHit[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    throw new Error("TAVILY_API_KEY not set — cannot run web search");
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: maxResults,
      search_depth: "basic",
      include_answer: false,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`tavily ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as TavilyResponse;
  return (data.results ?? []).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}
