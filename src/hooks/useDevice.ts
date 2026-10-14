import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'laptop' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

export interface DeviceInfo {
  width: number;
  height: number;
  deviceType: DeviceType;
  orientation: OrientationType;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTouch: boolean;
  pixelRatio: number;
  os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown';
  deviceLabel: string;
}

export function useDevice(): DeviceInfo {
  const getDeviceInfo = (): DeviceInfo => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const height = typeof window !== 'undefined' ? window.innerHeight : 800;
    const pixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

    // Device classification by width
    let deviceType: DeviceType = 'desktop';
    if (width < 640) {
      deviceType = 'mobile';
    } else if (width < 1024) {
      deviceType = 'tablet';
    } else if (width < 1440) {
      deviceType = 'laptop';
    } else {
      deviceType = 'desktop';
    }

    const isMobile = deviceType === 'mobile';
    const isTablet = deviceType === 'tablet';
    const isLaptop = deviceType === 'laptop';
    const isDesktop = deviceType === 'desktop';

    // Touch detection
    const isTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches));

    // Orientation
    const orientation: OrientationType = width > height ? 'landscape' : 'portrait';

    // Operating System detection from userAgent
    let os: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown' = 'Unknown';
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua)) {
        os = 'iOS';
      } else if (/Android/.test(ua)) {
        os = 'Android';
      } else if (/Win/.test(ua)) {
        os = 'Windows';
      } else if (/Mac/i.test(ua)) {
        os = 'macOS';
      } else if (/Linux/.test(ua)) {
        os = 'Linux';
      }
    }

    const typeNames: Record<DeviceType, string> = {
      mobile: 'Smartphone (Mobile)',
      tablet: 'Tablet',
      laptop: 'Laptop',
      desktop: 'Desktop / PC'
    };

    const deviceLabel = `${typeNames[deviceType]} • ${width}×${height}px • ${os}`;

    return {
      width,
      height,
      deviceType,
      orientation,
      isMobile,
      isTablet,
      isLaptop,
      isDesktop,
      isTouch,
      pixelRatio,
      os,
      deviceLabel
    };
  };

  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceInfo;
}
