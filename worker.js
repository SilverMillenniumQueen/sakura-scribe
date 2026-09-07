export default {
  async fetch(request) {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") || "";

    const appsScriptUrl =
      "https://script.google.com/macros/s/AKfycbxFRpQhZpsMd1KO3qC1lh8TERgZnBUtfrCedDbOKHoW0DO1SaI1HFWig3SzE50wPZFPIw/exec" +
      "?search=" + encodeURIComponent(search);

    const response = await fetch(appsScriptUrl, {
      redirect: "follow"
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
