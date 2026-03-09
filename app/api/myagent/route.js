import { NextResponse } from "next/server";

export async function GET(req) {
  const ua = req.headers.get("user-agent") || "";
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "unknown";

  // Parse OS
  let os = "Unknown OS";
  if (/Windows NT 11/i.test(ua)) os = "Windows 11";
  else if (/Windows NT 10/i.test(ua)) os = "Windows 10";
  else if (/Windows NT 6.3/i.test(ua)) os = "Windows 8.1";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone OS ([\d_]+)/i.test(ua)) os = "iOS " + ua.match(/iPhone OS ([\d_]+)/i)[1].replace(/_/g, ".");
  else if (/iPad.*OS ([\d_]+)/i.test(ua)) os = "iPadOS " + ua.match(/OS ([\d_]+)/i)[1].replace(/_/g, ".");
  else if (/Android ([\d.]+)/i.test(ua)) os = "Android " + ua.match(/Android ([\d.]+)/i)[1];
  else if (/Mac OS X ([\d_]+)/i.test(ua)) os = "macOS " + ua.match(/Mac OS X ([\d_]+)/i)[1].replace(/_/g, ".");
  else if (/Linux/i.test(ua)) os = "Linux";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";

  // Parse device brand
  let device = "Desktop";
  if (/vivo\s?([\w-]+)/i.test(ua)) device = "vivo " + (ua.match(/vivo\s?([\w-]+)/i)?.[1] || "");
  else if (/OPPO\s?([\w-]+)/i.test(ua)) device = "OPPO " + (ua.match(/OPPO\s?([\w-]+)/i)?.[1] || "");
  else if (/Xiaomi\s?([\w-]+)/i.test(ua)) device = "Xiaomi " + (ua.match(/Xiaomi\s?([\w-]+)/i)?.[1] || "");
  else if (/Redmi\s?([\w-]+)/i.test(ua)) device = "Redmi " + (ua.match(/Redmi\s?([\w-]+)/i)?.[1] || "");
  else if (/SAMSUNG\s?([\w-]+)/i.test(ua)) device = "Samsung " + (ua.match(/SAMSUNG\s?([\w-]+)/i)?.[1] || "");
  else if (/SM-[\w]+/i.test(ua)) device = "Samsung " + (ua.match(/SM-[\w]+/i)?.[0] || "");
  else if (/Huawei\s?([\w-]+)/i.test(ua)) device = "Huawei " + (ua.match(/Huawei\s?([\w-]+)/i)?.[1] || "");
  else if (/iPhone/i.test(ua)) device = "Apple iPhone";
  else if (/iPad/i.test(ua)) device = "Apple iPad";
  else if (/Pixel\s?([\w]+)/i.test(ua)) device = "Google Pixel " + (ua.match(/Pixel\s?([\w]+)/i)?.[1] || "");
  else if (/OnePlus\s?([\w-]+)/i.test(ua)) device = "OnePlus " + (ua.match(/OnePlus\s?([\w-]+)/i)?.[1] || "");
  else if (/Realme\s?([\w-]+)/i.test(ua)) device = "Realme " + (ua.match(/Realme\s?([\w-]+)/i)?.[1] || "");
  else if (/Android/i.test(ua)) device = "Android Device";
  else if (/Macintosh/i.test(ua)) device = "Apple Mac";
  else if (/Windows/i.test(ua)) device = "Windows PC";

  // Parse browser
  let browser = "Unknown";
  if (/Edg\/([\d.]+)/i.test(ua)) browser = "Microsoft Edge " + ua.match(/Edg\/([\d.]+)/i)[1].split(".")[0];
  else if (/OPR\/([\d.]+)/i.test(ua)) browser = "Opera " + ua.match(/OPR\/([\d.]+)/i)[1].split(".")[0];
  else if (/SamsungBrowser\/([\d.]+)/i.test(ua)) browser = "Samsung Browser " + ua.match(/SamsungBrowser\/([\d.]+)/i)[1];
  else if (/Chrome\/([\d.]+)/i.test(ua)) browser = "Chrome " + ua.match(/Chrome\/([\d.]+)/i)[1].split(".")[0];
  else if (/Firefox\/([\d.]+)/i.test(ua)) browser = "Firefox " + ua.match(/Firefox\/([\d.]+)/i)[1];
  else if (/Safari\/([\d.]+)/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
  else if (/MIUI Browser/i.test(ua)) browser = "MIUI Browser";

  // Mobile check
  const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);

  return NextResponse.json({
    ua, os, device, browser, isMobile,
    clientIp: ip,
  });
}
