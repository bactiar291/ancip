import { NextResponse } from "next/server";
export const maxDuration = 15;

// Multi-API fallback — semua gratis, tanpa key, HTTPS ✅
const APIS = [
  {
    name: "ipwho.is",
    url: (ip) => `https://ipwho.is/${ip}`,
    parse: (d) => {
      if (!d.success) throw new Error(d.message || "fail");
      return {
        ip: d.ip, type: d.type,
        country: d.country, countryCode: d.country_code,
        region: d.region, city: d.city, zip: d.postal,
        lat: d.latitude, lon: d.longitude,
        timezone: d.timezone?.id,
        isp: d.connection?.isp,
        org: d.connection?.org,
        asn: d.connection?.asn ? `AS${d.connection.asn}` : null,
        proxy: d.security?.proxy || d.security?.vpn || d.security?.tor || false,
        hosting: d.security?.hosting || false,
      };
    },
  },
  {
    name: "ipapi.co",
    url: (ip) => `https://ipapi.co/${ip}/json/`,
    parse: (d) => {
      if (d.error) throw new Error(d.reason || "fail");
      return {
        ip: d.ip, type: d.version,
        country: d.country_name, countryCode: d.country_code,
        region: d.region, city: d.city, zip: d.postal,
        lat: d.latitude, lon: d.longitude,
        timezone: d.timezone,
        isp: d.org, org: d.org,
        asn: d.asn,
        proxy: false, hosting: false,
      };
    },
  },
  {
    name: "ip.guide",
    url: (ip) => `https://ip.guide/${ip}`,
    parse: (d) => {
      if (!d.ip) throw new Error("no data");
      const loc = d.location || {};
      const net = d.network || {};
      return {
        ip: d.ip, type: d.ip?.includes(":") ? "IPv6" : "IPv4",
        country: loc.country_name, countryCode: loc.country_code,
        region: loc.region_name, city: loc.city,
        zip: loc.postal_code,
        lat: loc.latitude, lon: loc.longitude,
        timezone: loc.timezone,
        isp: net.name || net.organization,
        org: net.organization,
        asn: net.asn ? `AS${net.asn}` : null,
        proxy: false, hosting: false,
      };
    },
  },
];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ip = searchParams.get("ip") || "";

  // Kosong = deteksi IP pengguna
  const target = ip.trim();
  let lastErr = "Semua API gagal";

  for (const api of APIS) {
    try {
      const res = await fetch(api.url(target), {
        headers: { "Accept": "application/json", "User-Agent": "ancip/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) { lastErr = `${api.name}: HTTP ${res.status}`; continue; }
      const data = await res.json();
      const parsed = api.parse(data);
      return NextResponse.json({ ok: true, ...parsed, source: api.name });
    } catch (e) {
      lastErr = `${api.name}: ${e.message}`;
      continue;
    }
  }
  return NextResponse.json({ ok: false, error: lastErr }, { status: 502 });
}
