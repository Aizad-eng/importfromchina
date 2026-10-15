// Redirect www to the main domain (301) and the old /quote/ page to the homepage form, then serve the static site.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "www.importfromchina.shop") {
      url.hostname = "importfromchina.shop";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    // The old separate quote page now lives on the homepage form.
    if (url.pathname === "/quote" || url.pathname === "/quote/") return Response.redirect("https://importfromchina.shop/#quote", 301);
    return env.ASSETS.fetch(request);
  },
};
