import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.co.zibda.app',
  appName: '집다',
  webDir: 'dist',
  server: {
    // 운영 배포 시 실제 사이트를 그대로 로드
    url: 'https://zibda.co.kr',
    cleartext: false,
    androidScheme: 'https',
    allowNavigation: [
      'zibda.co.kr',
      '*.zibda.co.kr',
      'jibda.co.kr',
      '*.jibda.co.kr',
      '*.daumcdn.net',
      '*.kakao.com',
      '*.supabase.co',
      'accounts.google.com',
    ],
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#7c3aed',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
