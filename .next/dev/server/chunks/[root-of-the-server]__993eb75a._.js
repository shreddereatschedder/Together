module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/steam/games/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
const COOP_TAG = "1685" // Co-op
;
const MULTIPLAYER_TAG = "3859" // Multiplayer
;
async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "popular" // popular | recent
    ;
    const free = searchParams.get("free") === "true";
    const sort = type === "recent" ? "Released_DESC" : "Popular_DESC";
    const url = new URL("https://store.steampowered.com/api/storesearch");
    url.searchParams.set("l", "english");
    url.searchParams.set("cc", "GB");
    url.searchParams.set("page", "1");
    url.searchParams.set("page_size", "20");
    url.searchParams.set("sort_by", sort);
    url.searchParams.set("tags", `${COOP_TAG},${MULTIPLAYER_TAG}`);
    if (free) {
        url.searchParams.set("maxprice", "0");
    }
    try {
        const res = await fetch(url.toString(), {
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });
        const data = await res.json();
        const games = data.items.map((g)=>({
                id: g.id,
                title: g.name,
                poster: g.tiny_image,
                developer: g.developer || "Unknown",
                free: g.price?.final === 0
            }));
        return Response.json(games);
    } catch (error) {
        console.error("Steam API error:", error);
        return Response.json({
            error: "Failed to fetch games"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__993eb75a._.js.map