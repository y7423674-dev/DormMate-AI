import { NextRequest, NextResponse } from "next/server";
import type { AppIconName } from "@/components/AppIcon";
import { addDays, formatShortDate } from "@/lib/dateUtils";

type OpenMeteoDaily = {
  time?: string[];
  weather_code?: number[];
  temperature_2m_max?: number[];
  temperature_2m_min?: number[];
  precipitation_probability_max?: number[];
};

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
  daily?: OpenMeteoDaily;
};

function weatherCode(code: number): { text: string; icon: AppIconName; dryPenalty: number } {
  if (code === 0) return { text: "晴", icon: "sun", dryPenalty: 0 };
  if ([1, 2].includes(code)) return { text: "多云", icon: "cloudSun", dryPenalty: 8 };
  if (code === 3) return { text: "阴", icon: "cloudSun", dryPenalty: 18 };
  if (code >= 45 && code <= 48) return { text: "雾", icon: "cloudSun", dryPenalty: 18 };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { text: "雨", icon: "rain", dryPenalty: 45 };
  if (code >= 71 && code <= 77) return { text: "雪", icon: "rain", dryPenalty: 60 };
  if (code >= 95) return { text: "雷阵雨", icon: "rain", dryPenalty: 70 };
  return { text: "多云", icon: "cloudSun", dryPenalty: 12 };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildLaundryInfo(weatherPenalty: number, precipitation: number, temperature: number, windSpeed: number) {
  const tempBonus = temperature >= 18 && temperature <= 32 ? 10 : temperature > 32 ? 4 : -10;
  const windBonus = windSpeed >= 8 && windSpeed <= 24 ? 8 : windSpeed > 35 ? -12 : 0;
  const index = Math.round(clamp(92 - weatherPenalty - precipitation * 0.45 + tempBonus + windBonus, 15, 96));
  const suitable = index >= 60;
  const dryingHours = index >= 82 ? "3 - 5 小时" : index >= 60 ? "5 - 7 小时" : "不建议晾晒";
  const suggestion = suitable
    ? precipitation > 30
      ? "有降水概率，建议晾晒轻薄衣物并留意天气变化。"
      : "适合洗晒，优先轻薄衣物和床单，厚外套建议错峰晾晒。"
    : "天气不稳定或湿度偏高，建议改天再洗晒。";
  return { index, suitable, dryingHours, suggestion };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = Number(searchParams.get("lat") || process.env.DORM_LAT || 31.2304);
  const longitude = Number(searchParams.get("lon") || process.env.DORM_LON || 121.4737);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ error: "无效的天气定位参数" }, { status: 400 });
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("current", "temperature_2m,weather_code,wind_speed_10m");
  url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max");
  url.searchParams.set("forecast_days", "4");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "天气预报获取失败" }, { status: 502 });
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const daily = data.daily || {};
    const currentCode = data.current?.weather_code ?? daily.weather_code?.[0] ?? 1;
    const currentWeather = weatherCode(currentCode);
    const currentTemp = data.current?.temperature_2m ?? daily.temperature_2m_max?.[0] ?? 24;
    const minTemp = daily.temperature_2m_min?.[0] ?? currentTemp;
    const maxTemp = daily.temperature_2m_max?.[0] ?? currentTemp;
    const precipitation = daily.precipitation_probability_max?.[0] ?? 0;
    const windSpeed = data.current?.wind_speed_10m ?? 10;
    const laundry = buildLaundryInfo(currentWeather.dryPenalty, precipitation, currentTemp, windSpeed);

    const days = Array.from({ length: 4 }).map((_, index) => {
      const date = daily.time?.[index] ? new Date(`${daily.time[index]}T00:00:00`) : addDays(new Date(), index);
      const code = daily.weather_code?.[index] ?? currentCode;
      const weather = weatherCode(code);
      const dayMin = Math.round(daily.temperature_2m_min?.[index] ?? minTemp);
      const dayMax = Math.round(daily.temperature_2m_max?.[index] ?? maxTemp);
      return {
        label: index === 0 ? "今天" : index === 1 ? "明天" : index === 2 ? "后天" : `周${"日一二三四五六"[date.getDay()]}`,
        date: formatShortDate(date),
        icon: weather.icon,
        weather: weather.text,
        temperature: `${dayMin}℃ - ${dayMax}℃`,
      };
    });

    return NextResponse.json({
      source: "Open-Meteo",
      location: { latitude, longitude },
      current: {
        weather: `${currentWeather.text} / 风速${Math.round(windSpeed)}km/h`,
        weatherIcon: currentWeather.icon,
        temperature: `${Math.round(minTemp)}℃ - ${Math.round(maxTemp)}℃`,
        ...laundry,
      },
      days,
    });
  } catch {
    return NextResponse.json({ error: "天气预报获取失败" }, { status: 502 });
  }
}
