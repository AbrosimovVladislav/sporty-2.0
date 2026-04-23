// Telegram WebApp global, injected by telegram-web-app.js
interface Window {
  Telegram?: {
    WebApp: {
      initData: string;
      initDataUnsafe: {
        start_param?: string;
        user?: {
          id: number;
          first_name: string;
          last_name?: string;
          username?: string;
        };
      };
      ready: () => void;
      expand: () => void;
      close: () => void;
    };
  };
}
