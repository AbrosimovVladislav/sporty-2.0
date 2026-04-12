// Telegram WebApp global, injected by telegram-web-app.js
interface Window {
  Telegram?: {
    WebApp: {
      initData: string;
      ready: () => void;
      close: () => void;
    };
  };
}
