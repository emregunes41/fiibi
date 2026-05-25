"use client";
import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          function (registration) {
            console.log("PWA ServiceWorker registration successful");
          },
          function (err) {
            console.log("PWA ServiceWorker registration failed: ", err);
          }
        );
      });
    }
  }, []);
  return null;
}
