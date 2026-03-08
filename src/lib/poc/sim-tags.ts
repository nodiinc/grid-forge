export interface TagConfig {
  tagId: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  dataType: "analog" | "discrete";
  writable: boolean;
}

export const DEFAULT_TAGS: TagConfig[] = [
  { tagId: "/site1/bus/voltage", label: "모선 전압", unit: "V", min: 370, max: 390, dataType: "analog", writable: false },
  { tagId: "/site1/tr1/voltage", label: "변압기1 전압", unit: "V", min: 210, max: 230, dataType: "analog", writable: false },
  { tagId: "/site1/tr1/current", label: "변압기1 전류", unit: "A", min: 300, max: 420, dataType: "analog", writable: false },
  { tagId: "/site1/tr1/temp", label: "변압기1 온도", unit: "°C", min: 45, max: 75, dataType: "analog", writable: false },
  { tagId: "/site1/tr2/voltage", label: "변압기2 전압", unit: "V", min: 210, max: 230, dataType: "analog", writable: false },
  { tagId: "/site1/tr2/current", label: "변압기2 전류", unit: "A", min: 280, max: 400, dataType: "analog", writable: false },
  { tagId: "/site1/tr2/temp", label: "변압기2 온도", unit: "°C", min: 40, max: 70, dataType: "analog", writable: false },
  { tagId: "/site1/cb1/status", label: "차단기1 상태", unit: "", min: 0, max: 1, dataType: "discrete", writable: true },
  { tagId: "/site1/cb2/status", label: "차단기2 상태", unit: "", min: 0, max: 1, dataType: "discrete", writable: true },
  { tagId: "/site1/cb3/status", label: "차단기3 상태", unit: "", min: 0, max: 1, dataType: "discrete", writable: true },
  { tagId: "/site1/power/active", label: "유효전력", unit: "kW", min: 800, max: 1200, dataType: "analog", writable: false },
  { tagId: "/site1/power/reactive", label: "무효전력", unit: "kVar", min: 200, max: 400, dataType: "analog", writable: false },
  { tagId: "/site1/power/factor", label: "역률", unit: "", min: 0.85, max: 0.99, dataType: "analog", writable: false },
  { tagId: "/site1/motor1/rpm", label: "모터1 회전수", unit: "RPM", min: 1400, max: 1500, dataType: "analog", writable: false },
  { tagId: "/site1/motor1/temp", label: "모터1 온도", unit: "°C", min: 40, max: 85, dataType: "analog", writable: false },
  { tagId: "/site1/motor1/vibration", label: "모터1 진동", unit: "mm/s", min: 0.5, max: 4.5, dataType: "analog", writable: false },
  { tagId: "/site1/env/temp", label: "실내 온도", unit: "°C", min: 20, max: 30, dataType: "analog", writable: false },
  { tagId: "/site1/env/humidity", label: "실내 습도", unit: "%", min: 40, max: 70, dataType: "analog", writable: false },
  { tagId: "/site1/setpoint/voltage", label: "전압 설정값", unit: "V", min: 200, max: 240, dataType: "analog", writable: true },
  { tagId: "/site1/setpoint/temp_limit", label: "온도 경보치", unit: "°C", min: 60, max: 100, dataType: "analog", writable: true },
];
