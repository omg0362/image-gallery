import Script from "next/script";

export function KakaoAdFit() {
  return (
    <div className="flex justify-center bg-[#f8f6f1] px-5 py-6">
      <ins
        className="kakao_ad_area"
        style={{ display: "none" }}
        data-ad-unit="DAN-XNRi8ystdJ8cUEW4"
        data-ad-width="250"
        data-ad-height="250"
      />
      <Script
        id="kakao-adfit-sdk"
        src="https://t1.kakaocdn.net/kas/static/ba.min.js"
        strategy="afterInteractive"
      />
    </div>
  );
}
