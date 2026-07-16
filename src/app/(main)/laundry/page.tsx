"use client";

import { useEffect, useState } from "react";
import { useDorm } from "@/app/DormProvider";
import type { DormState } from "@/data/types";
import AppIcon, { type AppIconName } from "@/components/AppIcon";
import PageHeader from "@/components/PageHeader";
import CardShell from "@/components/CardShell";
import { addDays, formatShortDate, toDateISO } from "@/lib/dateUtils";

type WeatherForecast = {
  source: string;
  current: {
    weather: string;
    weatherIcon: AppIconName;
    temperature: string;
    index: number;
    suitable: boolean;
    suggestion: string;
    dryingHours: string;
  };
  days: {
    label: string;
    date: string;
    icon: AppIconName;
    weather: string;
    temperature: string;
  }[];
};

export default function LaundryPage() {
  const { state, apiPost, session } = useDorm();
  const [weatherForecast, setWeatherForecast] = useState<WeatherForecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCollectConfirm, setShowCollectConfirm] = useState(false);
  const [dryType, setDryType] = useState("轻薄衣物");
  const [collectTime, setCollectTime] = useState("22:00");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedCollectIndex, setSelectedCollectIndex] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadWeather(position?: GeolocationPosition) {
      const params = new URLSearchParams();
      if (position) {
        params.set("lat", String(position.coords.latitude));
        params.set("lon", String(position.coords.longitude));
      }
      try {
        const response = await fetch(`/api/weather${params.size ? `?${params.toString()}` : ""}`, { cache: "no-store" });
        if (!response.ok) throw new Error("weather failed");
        const data = (await response.json()) as WeatherForecast;
        if (!cancelled) setWeatherForecast(data);
      } catch {
        if (!cancelled) setWeatherForecast(null);
      } finally {
        if (!cancelled) setWeatherLoading(false);
      }
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => { void loadWeather(position); },
        () => { void loadWeather(); },
        { maximumAge: 30 * 60 * 1000, timeout: 5000 }
      );
    } else {
      void loadWeather();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!state || !session) return null;

  const s: DormState = state;
  const myName = session.nickname;
  const laundry = s.laundry;
  const balcony = s.balcony;
  const mySlots = balcony.slots
    .map((slot, index) => ({ ...slot, index }))
    .filter((slot) => slot.user === myName);
  const mySlot = mySlots[0];
  const remainingSlots = balcony.totalSlots - balcony.slots.length;
  const canDry = remainingSlots > 0;
  const currentLaundry = weatherForecast?.current ?? {
    weather: laundry.weather,
    weatherIcon: laundry.weatherIcon as AppIconName,
    temperature: laundry.temperature,
    index: laundry.index,
    suitable: laundry.suitable,
    suggestion: laundry.suggestion,
    dryingHours: laundry.dryingHours,
  };
  const forecastDays = weatherForecast?.days ?? Array.from({ length: 4 }).map((_, index) => {
    const date = addDays(new Date(), index);
    return {
      label: index === 0 ? "今天" : index === 1 ? "明天" : index === 2 ? "后天" : `周${"日一二三四五六"[date.getDay()]}`,
      date: formatShortDate(date),
      icon: index === 2 ? "rain" as AppIconName : index === 1 ? "cloudSun" as AppIconName : "sun" as AppIconName,
      weather: index === 2 ? "雨" : index === 1 ? "多云" : "晴",
      temperature: laundry.temperature,
    };
  });

  async function handleCollect() {
    if (!mySlot) {
      setFeedback("你当前没有待收取的衣物。");
      return;
    }
    const collectIndex = selectedCollectIndex || String(mySlot.index);
    const selectedSlot = mySlots.find((slot) => String(slot.index) === collectIndex) ?? mySlot;
    setSubmitting(true);
    await apiPost("laundry/collect", { userName: myName, slotIndex: collectIndex });
    setSubmitting(false);
    setShowCollectConfirm(false);
    setSelectedCollectIndex("");
    setFeedback(`已收取${selectedSlot.type}，已释放 1 个阳台位置。`);
  }

  async function handleDry() {
    if (!canDry) {
      setFormError("阳台位置已满，请稍后再试。");
      return;
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(collectTime.trim())) {
      setFormError("请输入 24 小时制时间，例如 22:00。");
      return;
    }
    setFormError("");
    setSubmitting(true);
    await apiPost("laundry/dry", { userName: myName, type: dryType, collectTime: collectTime.trim() });
    setSubmitting(false);
    setShowModal(false);
  }

  return (
    <div>
      <PageHeader title="洗晒" />

      {/* Forecast */}
      <CardShell title="未来几天天气">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-muted-olive">日期：{toDateISO(new Date())}</span>
          <span className="text-xs font-bold text-muted-olive">
            {weatherLoading ? "同步中..." : weatherForecast ? `已同步 ${weatherForecast.source}` : "使用默认天气"}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {forecastDays.map((day) => (
            <div
              key={day.date}
              className="rounded-[18px] border border-white/70 bg-white/55 px-2 py-2 text-center text-olive-ink shadow-[0_10px_22px_rgba(82,94,72,0.08)]"
            >
              <span className="text-sm font-semibold">{day.label}</span>
              <span className="text-xs text-muted-olive block">{day.date}</span>
              <span className="icon-badge-sm mx-auto mt-1">
                <AppIcon name={day.icon as AppIconName} className="h-[18px] w-[18px]" />
              </span>
              <span className="mt-1 block text-[11px] font-semibold text-muted-olive">{day.weather}</span>
            </div>
          ))}
        </div>
      </CardShell>

      {/* Laundry Index */}
      <CardShell variant="sage" title="今日洗晒">
        <p className="flex items-center gap-2 text-base font-semibold text-deep-olive">
          <span className="icon-badge-sm">
            <AppIcon name={currentLaundry.weatherIcon} className="h-[18px] w-[18px]" />
          </span>
          {currentLaundry.weather} {currentLaundry.temperature}
        </p>
        <p className="text-sm text-olive-ink mt-1">
          洗晒指数：<strong className="text-[#6D8F3E]">{currentLaundry.index}</strong> {currentLaundry.suitable ? "适合洗晒" : "不适合洗晒"}
        </p>
        <p className="text-sm text-muted-olive">预计晾晒时长：{currentLaundry.dryingHours}</p>
        <p className="text-sm text-muted-olive leading-relaxed mt-1">
          提醒：{currentLaundry.suggestion}
        </p>
      </CardShell>

      {/* Balcony Occupancy */}
      <CardShell title="阳台占用情况">
        <div>
          <p className="text-base font-semibold text-deep-olive">当前占用</p>
          <p className="mt-0.5 text-sm text-muted-olive">
            <strong className="text-deep-olive">{balcony.slots.length}</strong> / {balcony.totalSlots} 个位置
          </p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5" aria-hidden="true">
          {Array.from({ length: balcony.totalSlots }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full ${
                index < balcony.slots.length ? "bg-[#A7D86D]" : "bg-[#E7ECDR]"
              }`}
            />
          ))}
        </div>
        {feedback && (
          <p className="mt-3 rounded-[18px] border border-white/75 bg-[#EEF5E8] px-3 py-2 text-sm font-semibold text-[#5F684D]">
            {feedback}
          </p>
        )}

        {balcony.slots.length > 0 && (
          <div className="mt-4 divide-y divide-[#E3E8DD]">
            {balcony.slots.map((slot, i) => (
              <div key={`${slot.user}-${i}`} className="flex items-center gap-3 py-3 text-sm">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#A7D86D]" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold text-deep-olive">{slot.user}</span>
                    {slot.user === myName && <span className="text-xs font-semibold text-[#6D8F3E]">我的</span>}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-medium text-muted-olive">{slot.type}</p>
                </div>
                <span className="whitespace-nowrap text-xs font-semibold text-muted-olive">{slot.collectTime} 收衣</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={() => setShowModal(true)}
            className="btn-dark text-sm"
            disabled={!canDry || submitting}
          >
            我要晾晒
          </button>
          <button
            onClick={() => {
              if (!mySlot) {
                setFeedback("你当前没有待收取的衣物。");
                return;
              }
              setSelectedCollectIndex(String(mySlot.index));
              setShowCollectConfirm(true);
            }}
            className="btn-sage text-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
          >
            我要收衣
          </button>
        </div>
        {!canDry && (
          <p className="mt-3 text-xs font-medium text-muted-olive">
            阳台位置已满，暂时不能新增晾晒。
          </p>
        )}
      </CardShell>

      {/* AI Suggestion */}
      <CardShell variant="sage" title="AI 轻量建议">
        <p className="text-sm text-muted-olive leading-relaxed">
          {currentLaundry.suggestion} 当前还有 {remainingSlots} 个空位。
        </p>
      </CardShell>

      {/* Dry Modal */}
      {showModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setShowModal(false)} />
          <div className="relative max-h-[78vh] w-full overflow-y-auto rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_24px_70px_rgba(32,37,30,0.22)] backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-bold text-deep-olive">我要晾晒</h3>

            {/* Type selection */}
            <div className="mb-3 flex gap-2">
              {["轻薄衣物", "床单", "厚外套"].map((t) => (
                <button
                  key={t}
                  onClick={() => setDryType(t)}
                  className={`rounded-[18px] px-3 py-2 text-sm font-semibold transition ${
                    dryType === t
                      ? "bg-[#20251E] text-white"
                      : "border border-[#E3E8DD] bg-[#EEF5E8] text-olive-ink hover:text-[#1F241E]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Collect time */}
            <div className="mb-3">
              <label className="mb-1 block text-sm font-semibold text-deep-olive">预计收衣时间</label>
              <input
                type="text"
                value={collectTime}
                onChange={(e) => setCollectTime(e.target.value)}
                className="input-default"
                placeholder="22:00"
              />
            </div>

            <div className="rounded-[18px] bg-[#EEF5E8] px-3 py-2">
              <p className="text-sm font-semibold text-[#5F684D]">占用位置：1 个</p>
              <p className="mt-0.5 text-xs text-muted-olive">当前还剩 {remainingSlots} 个空位</p>
            </div>
            {formError && (
              <p className="mt-3 rounded-[16px] bg-[#FFF8ED] px-3 py-2 text-sm font-bold text-[#8A5A25]">
                {formError}
              </p>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-sage flex-1 text-center">取消</button>
              <button onClick={handleDry} disabled={submitting} className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none">
                {submitting ? "登记中..." : "确认晾晒"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCollectConfirm && mySlot && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]" onClick={() => setShowCollectConfirm(false)} />
          <div className="relative w-full rounded-[30px] border border-white/75 bg-white/90 p-5 shadow-[0_24px_70px_rgba(32,37,30,0.22)] backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-bold text-deep-olive">确认收衣</h3>
            <p className="text-sm text-muted-olive">
              选择要收取的晾晒记录，确认后释放 1 个阳台位置。
            </p>
            <div className="mt-3 space-y-2">
              {mySlots.map((slot) => (
                <label
                  key={`${slot.index}-${slot.type}-${slot.collectTime}`}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-[18px] border px-3 py-2 text-sm transition ${
                    selectedCollectIndex === String(slot.index)
                      ? "border-[#A7D86D] bg-[#EEF5E8] text-deep-olive"
                      : "border-[#E3E8DD] bg-white/65 text-olive-ink"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <input
                      type="radio"
                      name="collectSlot"
                      value={slot.index}
                      checked={selectedCollectIndex === String(slot.index)}
                      onChange={(e) => setSelectedCollectIndex(e.target.value)}
                      className="h-4 w-4 accent-[#6D8F3E]"
                    />
                    <span className="font-semibold">{slot.type}</span>
                  </span>
                  <span className="whitespace-nowrap text-muted-olive">{slot.collectTime}收衣</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setShowCollectConfirm(false)} className="btn-sage flex-1 text-center">取消</button>
              <button onClick={handleCollect} disabled={submitting} className="btn-dark flex-1 text-center disabled:cursor-not-allowed disabled:bg-[#8A9084] disabled:shadow-none">
                {submitting ? "处理中..." : "确认收衣"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
